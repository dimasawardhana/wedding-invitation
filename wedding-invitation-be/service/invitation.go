package service

import (
	"errors"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
	"wedding-invitation-be/domain"
	"wedding-invitation-be/repository"
)

var (
	ErrInvitationNotFound = errors.New("invitation not found")
	ErrSlugConflict       = errors.New("slug already in use")
	ErrForbidden          = errors.New("forbidden")
)

type CreateInvitationInput struct {
	Slug        string
	LayoutID    string
	ThemeConfig datatypes.JSON
	MusicURL    string
	Couple      datatypes.JSON
	Events      datatypes.JSON
	Stories     datatypes.JSON
	Gallery     datatypes.JSON
}

type UpdateInvitationInput struct {
	Slug        *string
	LayoutID    *string
	ThemeConfig datatypes.JSON
	MusicURL    *string
	Couple      datatypes.JSON
	Events      datatypes.JSON
	Stories     datatypes.JSON
	Gallery     datatypes.JSON
}

type InvitationService interface {
	Create(userID uuid.UUID, input CreateInvitationInput) (*domain.Invitation, error)
	ListAll() ([]domain.Invitation, error)
	ListByUser(userID uuid.UUID) ([]domain.Invitation, error)
	GetByID(id uuid.UUID) (*domain.Invitation, error)
	GetBySlug(slug string) (*domain.Invitation, error)
	IncrementViews(slug string) (int64, error)
	Update(id, userID uuid.UUID, input UpdateInvitationInput) (*domain.Invitation, error)
	Delete(id, userID uuid.UUID) error
	// CheckOwner returns ErrInvitationNotFound / ErrForbidden without mutating anything.
	CheckOwner(id, userID uuid.UUID) error
}

type invitationService struct {
	repo repository.InvitationRepository
}

func NewInvitationService(repo repository.InvitationRepository) InvitationService {
	return &invitationService{repo: repo}
}

func (s *invitationService) Create(userID uuid.UUID, input CreateInvitationInput) (*domain.Invitation, error) {
	exists, err := s.repo.SlugExists(input.Slug, nil)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrSlugConflict
	}

	inv := &domain.Invitation{
		UserID:      userID,
		Slug:        input.Slug,
		LayoutID:    input.LayoutID,
		ThemeConfig: input.ThemeConfig,
		MusicURL:    input.MusicURL,
		Couple:      input.Couple,
		Events:      input.Events,
		Stories:     input.Stories,
		Gallery:     input.Gallery,
	}
	if err := s.repo.Create(inv); err != nil {
		return nil, err
	}
	return inv, nil
}

func (s *invitationService) ListAll() ([]domain.Invitation, error) {
	return s.repo.FindAll()
}

func (s *invitationService) ListByUser(userID uuid.UUID) ([]domain.Invitation, error) {
	return s.repo.FindByUserID(userID)
}

func (s *invitationService) GetByID(id uuid.UUID) (*domain.Invitation, error) {
	inv, err := s.repo.FindByID(id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrInvitationNotFound
	}
	return inv, err
}

func (s *invitationService) GetBySlug(slug string) (*domain.Invitation, error) {
	inv, err := s.repo.FindBySlug(slug)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrInvitationNotFound
	}
	return inv, err
}

func (s *invitationService) IncrementViews(slug string) (int64, error) {
	inv, err := s.repo.FindBySlug(slug)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return 0, ErrInvitationNotFound
	}
	if err != nil {
		return 0, err
	}
	return s.repo.IncrementViews(inv.ID)
}

func (s *invitationService) Update(id, userID uuid.UUID, input UpdateInvitationInput) (*domain.Invitation, error) {
	inv, err := s.repo.FindByID(id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrInvitationNotFound
	}
	if err != nil {
		return nil, err
	}
	if inv.UserID != userID {
		return nil, ErrForbidden
	}

	if input.Slug != nil && *input.Slug != inv.Slug {
		exists, err := s.repo.SlugExists(*input.Slug, &id)
		if err != nil {
			return nil, err
		}
		if exists {
			return nil, ErrSlugConflict
		}
		inv.Slug = *input.Slug
	}
	if input.LayoutID != nil {
		inv.LayoutID = *input.LayoutID
	}
	if input.MusicURL != nil {
		inv.MusicURL = *input.MusicURL
	}
	if input.ThemeConfig != nil {
		inv.ThemeConfig = input.ThemeConfig
	}
	if input.Couple != nil {
		inv.Couple = input.Couple
	}
	if input.Events != nil {
		inv.Events = input.Events
	}
	if input.Stories != nil {
		inv.Stories = input.Stories
	}
	if input.Gallery != nil {
		inv.Gallery = input.Gallery
	}

	if err := s.repo.Update(inv); err != nil {
		return nil, err
	}
	return inv, nil
}

func (s *invitationService) Delete(id, userID uuid.UUID) error {
	inv, err := s.repo.FindByID(id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrInvitationNotFound
	}
	if err != nil {
		return err
	}
	if inv.UserID != userID {
		return ErrForbidden
	}
	return s.repo.Delete(id)
}

func (s *invitationService) CheckOwner(id, userID uuid.UUID) error {
	inv, err := s.repo.FindByID(id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrInvitationNotFound
	}
	if err != nil {
		return err
	}
	if inv.UserID != userID {
		return ErrForbidden
	}
	return nil
}
