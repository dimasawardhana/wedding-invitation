package handler

import (
	"errors"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/datatypes"
	"wedding-invitation-be/service"
)

type InvitationHandler struct {
	svc service.InvitationService
}

func NewInvitationHandler(svc service.InvitationService) *InvitationHandler {
	return &InvitationHandler{svc: svc}
}

func currentUserID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, false
	}
	id, ok := val.(uuid.UUID)
	return id, ok
}

// POST /api/v1/admin/invitation
func (h *InvitationHandler) Create(c *gin.Context) {
	var input struct {
		Slug        string         `json:"slug" binding:"required"`
		LayoutID    string         `json:"layout_id"`
		ThemeConfig datatypes.JSON `json:"theme_config"`
		MusicURL    string         `json:"music_url"`
		Couple      datatypes.JSON `json:"couple"`
		Events      datatypes.JSON `json:"events"`
		Stories     datatypes.JSON `json:"stories"`
		Gallery     datatypes.JSON `json:"gallery"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		badRequest(c, err.Error())
		return
	}

	userID, ok := currentUserID(c)
	if !ok {
		unauthorized(c, "unauthorized")
		return
	}

	inv, err := h.svc.Create(userID, service.CreateInvitationInput{
		Slug:        input.Slug,
		LayoutID:    input.LayoutID,
		ThemeConfig: input.ThemeConfig,
		MusicURL:    input.MusicURL,
		Couple:      input.Couple,
		Events:      input.Events,
		Stories:     input.Stories,
		Gallery:     input.Gallery,
	})
	if err != nil {
		if errors.Is(err, service.ErrSlugConflict) {
			conflict(c, err.Error())
			return
		}
		serverError(c, err)
		return
	}
	created(c, inv)
}

// GET /api/v1/admin/invitations
func (h *InvitationHandler) ListMine(c *gin.Context) {
	userID, ok := currentUserID(c)
	if !ok {
		unauthorized(c, "unauthorized")
		return
	}
	invitations, err := h.svc.ListByUser(userID)
	if err != nil {
		serverError(c, err)
		return
	}
	ok_(c, invitations)
}

// helper alias to avoid collision with bool ok variable
func ok_(c *gin.Context, data interface{}) { ok(c, data) }

// GET /api/v1/admin/invitation/:id
func (h *InvitationHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	inv, err := h.svc.GetByID(id)
	if err != nil {
		if errors.Is(err, service.ErrInvitationNotFound) {
			notFound(c, err.Error())
			return
		}
		serverError(c, err)
		return
	}
	ok(c, inv)
}

// GET /api/v1/public/invitation/:slug
func (h *InvitationHandler) GetBySlug(c *gin.Context) {
	inv, err := h.svc.GetBySlug(c.Param("slug"))
	if err != nil {
		if errors.Is(err, service.ErrInvitationNotFound) {
			notFound(c, err.Error())
			return
		}
		serverError(c, err)
		return
	}
	ok(c, inv)
}

// POST /api/v1/public/invitation/:slug/view
func (h *InvitationHandler) RecordView(c *gin.Context) {
	views, err := h.svc.IncrementViews(c.Param("slug"))
	if err != nil {
		if errors.Is(err, service.ErrInvitationNotFound) {
			notFound(c, err.Error())
			return
		}
		serverError(c, err)
		return
	}
	ok(c, gin.H{"views": views})
}

// PATCH /api/v1/admin/invitation/:id
func (h *InvitationHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	userID, authOK := currentUserID(c)
	if !authOK {
		unauthorized(c, "unauthorized")
		return
	}

	var input struct {
		Slug        *string        `json:"slug"`
		LayoutID    *string        `json:"layout_id"`
		ThemeConfig datatypes.JSON `json:"theme_config"`
		MusicURL    *string        `json:"music_url"`
		Couple      datatypes.JSON `json:"couple"`
		Events      datatypes.JSON `json:"events"`
		Stories     datatypes.JSON `json:"stories"`
		Gallery     datatypes.JSON `json:"gallery"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		badRequest(c, err.Error())
		return
	}

	inv, err := h.svc.Update(id, userID, service.UpdateInvitationInput{
		Slug:        input.Slug,
		LayoutID:    input.LayoutID,
		ThemeConfig: input.ThemeConfig,
		MusicURL:    input.MusicURL,
		Couple:      input.Couple,
		Events:      input.Events,
		Stories:     input.Stories,
		Gallery:     input.Gallery,
	})
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvitationNotFound):
			notFound(c, err.Error())
		case errors.Is(err, service.ErrForbidden):
			forbidden(c)
		case errors.Is(err, service.ErrSlugConflict):
			conflict(c, err.Error())
		default:
			serverError(c, err)
		}
		return
	}
	ok(c, inv)
}

// DELETE /api/v1/admin/invitation/:id
func (h *InvitationHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	userID, ok := currentUserID(c)
	if !ok {
		unauthorized(c, "unauthorized")
		return
	}

	if err := h.svc.Delete(id, userID); err != nil {
		switch {
		case errors.Is(err, service.ErrInvitationNotFound):
			notFound(c, err.Error())
		case errors.Is(err, service.ErrForbidden):
			forbidden(c)
		default:
			serverError(c, err)
		}
		return
	}
	deleted(c)
}
