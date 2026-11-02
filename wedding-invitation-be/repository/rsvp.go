package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"wedding-invitation-be/domain"
)

type rsvpRepository struct {
	db *gorm.DB
}

func NewRSVPRepository(db *gorm.DB) RSVPRepository {
	return &rsvpRepository{db: db}
}

func (r *rsvpRepository) Create(rsvp *domain.RSVP) error {
	return r.db.Create(rsvp).Error
}

func (r *rsvpRepository) FindByInvitationID(invitationID uuid.UUID) ([]domain.RSVP, error) {
	var rsvps []domain.RSVP
	if err := r.db.Where("invitation_id = ?", invitationID).Order("created_at desc").Find(&rsvps).Error; err != nil {
		return nil, err
	}
	return rsvps, nil
}

func (r *rsvpRepository) ListBySlug(slug string) ([]domain.RSVP, error) {
	var rsvps []domain.RSVP
	err := r.db.
		Joins("JOIN invitations ON invitations.id = rsvps.invitation_id").
		Where("invitations.slug = ?", slug).
		Order("rsvps.created_at desc").
		Find(&rsvps).Error
	return rsvps, err
}

// Delete removes a single RSVP, scoped to its invitation so a caller cannot
// delete a row belonging to an invitation they do not own. Returns
// gorm.ErrRecordNotFound when no matching row exists.
func (r *rsvpRepository) Delete(invitationID, id uuid.UUID) error {
	result := r.db.Delete(&domain.RSVP{}, "id = ? AND invitation_id = ?", id, invitationID)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
