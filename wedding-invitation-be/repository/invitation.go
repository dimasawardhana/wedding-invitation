package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"wedding-invitation-be/domain"
)

type invitationRepository struct {
	db *gorm.DB
}

func NewInvitationRepository(db *gorm.DB) InvitationRepository {
	return &invitationRepository{db: db}
}

func (r *invitationRepository) Create(inv *domain.Invitation) error {
	return r.db.Create(inv).Error
}

func (r *invitationRepository) FindAll() ([]domain.Invitation, error) {
	var invitations []domain.Invitation
	if err := r.db.Order("created_at desc").Find(&invitations).Error; err != nil {
		return nil, err
	}
	return invitations, nil
}

func (r *invitationRepository) FindByID(id uuid.UUID) (*domain.Invitation, error) {
	var inv domain.Invitation
	if err := r.db.First(&inv, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &inv, nil
}

func (r *invitationRepository) FindBySlug(slug string) (*domain.Invitation, error) {
	var inv domain.Invitation
	if err := r.db.Where("slug = ?", slug).First(&inv).Error; err != nil {
		return nil, err
	}
	return &inv, nil
}

func (r *invitationRepository) IncrementViews(id uuid.UUID) (int64, error) {
	var inv domain.Invitation
	if err := r.db.First(&inv, "id = ?", id).Error; err != nil {
		return 0, err
	}
	if err := r.db.Model(&inv).UpdateColumn("views", gorm.Expr("views + ?", 1)).Error; err != nil {
		return 0, err
	}
	return inv.Views + 1, nil
}

func (r *invitationRepository) FindByUserID(userID uuid.UUID) ([]domain.Invitation, error) {
	var invitations []domain.Invitation
	if err := r.db.Where("user_id = ?", userID).Order("created_at desc").Find(&invitations).Error; err != nil {
		return nil, err
	}
	return invitations, nil
}

func (r *invitationRepository) Update(inv *domain.Invitation) error {
	return r.db.Save(inv).Error
}

func (r *invitationRepository) Delete(id uuid.UUID) error {
	result := r.db.Delete(&domain.Invitation{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *invitationRepository) SlugExists(slug string, excludeID *uuid.UUID) (bool, error) {
	var count int64
	q := r.db.Model(&domain.Invitation{}).Where("slug = ?", slug)
	if excludeID != nil {
		q = q.Where("id != ?", *excludeID)
	}
	if err := q.Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}
