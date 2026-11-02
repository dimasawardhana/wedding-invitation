package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type Invitation struct {
	ID          uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey"`
	UserID      uuid.UUID      `json:"user_id" gorm:"type:uuid;not null;index"`
	User        *User          `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Slug        string         `json:"slug" gorm:"uniqueIndex;not null"`
	LayoutID    string         `json:"layout_id"`
	ThemeConfig datatypes.JSON `json:"theme_config" gorm:"type:jsonb"`
	MusicURL    string         `json:"music_url"`
	Couple      datatypes.JSON `json:"couple" gorm:"type:jsonb"`
	Events      datatypes.JSON `json:"events" gorm:"type:jsonb"`
	Stories     datatypes.JSON `json:"stories" gorm:"type:jsonb"`
	Gallery     datatypes.JSON `json:"gallery" gorm:"type:jsonb"`
	Views       int64          `json:"views" gorm:"not null;default:0"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

func (i *Invitation) BeforeCreate(tx *gorm.DB) error {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	return nil
}
