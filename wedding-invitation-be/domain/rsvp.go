package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RSVP struct {
	ID               uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	InvitationID     uuid.UUID `json:"invitation_id" gorm:"type:uuid;not null;index"`
	GuestName        string    `json:"guest_name" gorm:"not null"`
	AttendanceStatus bool      `json:"attendance_status"`
	TotalPax         int       `json:"total_pax"`
	Message          string    `json:"message" gorm:"type:text"`
	CreatedAt        time.Time `json:"created_at"`
}

func (r *RSVP) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}
