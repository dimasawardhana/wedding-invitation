package service

import (
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"wedding-invitation-be/domain"
	"wedding-invitation-be/repository"
)

var (
	ErrInvitationNotFoundForRSVP = errors.New("invitation not found")
	ErrRSVPNotFound              = errors.New("rsvp not found")
)

type SubmitRSVPInput struct {
	InvitationID     uuid.UUID
	GuestName        string
	AttendanceStatus bool
	TotalPax         int
	Message          string
}

type RSVPService interface {
	Submit(input SubmitRSVPInput) (*domain.RSVP, error)
	ListByInvitation(invitationID, userID uuid.UUID, invSvc InvitationService) ([]domain.RSVP, error)
	ListBySlug(slug string) ([]domain.RSVP, error)
	Delete(invitationID, rsvpID, userID uuid.UUID) error
}

type rsvpService struct {
	repo    repository.RSVPRepository
	invRepo repository.InvitationRepository
}

func NewRSVPService(repo repository.RSVPRepository, invRepo repository.InvitationRepository) RSVPService {
	return &rsvpService{repo: repo, invRepo: invRepo}
}

func (s *rsvpService) Submit(input SubmitRSVPInput) (*domain.RSVP, error) {
	_, err := s.invRepo.FindByID(input.InvitationID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrInvitationNotFoundForRSVP
	}
	if err != nil {
		return nil, err
	}

	rsvp := &domain.RSVP{
		InvitationID:     input.InvitationID,
		GuestName:        input.GuestName,
		AttendanceStatus: input.AttendanceStatus,
		TotalPax:         input.TotalPax,
		Message:          input.Message,
	}
	if err := s.repo.Create(rsvp); err != nil {
		return nil, err
	}
	return rsvp, nil
}

func (s *rsvpService) ListByInvitation(invitationID, userID uuid.UUID, invSvc InvitationService) ([]domain.RSVP, error) {
	inv, err := s.invRepo.FindByID(invitationID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrInvitationNotFound
	}
	if err != nil {
		return nil, err
	}
	if inv.UserID != userID {
		return nil, ErrForbidden
	}
	return s.repo.FindByInvitationID(invitationID)
}

func (s *rsvpService) ListBySlug(slug string) ([]domain.RSVP, error) {
	return s.repo.ListBySlug(slug)
}

// Delete removes an RSVP after confirming the caller owns its invitation.
func (s *rsvpService) Delete(invitationID, rsvpID, userID uuid.UUID) error {
	inv, err := s.invRepo.FindByID(invitationID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrInvitationNotFound
	}
	if err != nil {
		return err
	}
	if inv.UserID != userID {
		return ErrForbidden
	}

	if err := s.repo.Delete(invitationID, rsvpID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrRSVPNotFound
		}
		return err
	}
	return nil
}
