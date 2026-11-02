package repository

import (
	"github.com/google/uuid"
	"wedding-invitation-be/domain"
)

type UserRepository interface {
	Create(user *domain.User) error
	FindByEmail(email string) (*domain.User, error)
	FindByID(id uuid.UUID) (*domain.User, error)
}

type InvitationRepository interface {
	Create(inv *domain.Invitation) error
	FindAll() ([]domain.Invitation, error)
	FindByID(id uuid.UUID) (*domain.Invitation, error)
	FindBySlug(slug string) (*domain.Invitation, error)
	IncrementViews(id uuid.UUID) (int64, error)
	FindByUserID(userID uuid.UUID) ([]domain.Invitation, error)
	Update(inv *domain.Invitation) error
	Delete(id uuid.UUID) error
	SlugExists(slug string, excludeID *uuid.UUID) (bool, error)
}

type RSVPRepository interface {
	Create(rsvp *domain.RSVP) error
	FindByInvitationID(invitationID uuid.UUID) ([]domain.RSVP, error)
	ListBySlug(slug string) ([]domain.RSVP, error)
	Delete(invitationID, id uuid.UUID) error
}
