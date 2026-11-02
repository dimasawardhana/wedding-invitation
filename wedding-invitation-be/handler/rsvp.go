package handler

import (
	"errors"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"wedding-invitation-be/service"
)

type RSVPHandler struct {
	svc    service.RSVPService
	invSvc service.InvitationService
}

func NewRSVPHandler(svc service.RSVPService, invSvc service.InvitationService) *RSVPHandler {
	return &RSVPHandler{svc: svc, invSvc: invSvc}
}

// POST /api/v1/public/rsvp
func (h *RSVPHandler) Submit(c *gin.Context) {
	var input struct {
		InvitationID     string `json:"invitation_id" binding:"required"`
		GuestName        string `json:"guest_name" binding:"required"`
		AttendanceStatus bool   `json:"attendance_status"`
		TotalPax         int    `json:"total_pax"`
		Message          string `json:"message"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		badRequest(c, err.Error())
		return
	}

	invID, err := uuid.Parse(input.InvitationID)
	if err != nil {
		badRequest(c, "invalid invitation_id")
		return
	}

	rsvp, err := h.svc.Submit(service.SubmitRSVPInput{
		InvitationID:     invID,
		GuestName:        input.GuestName,
		AttendanceStatus: input.AttendanceStatus,
		TotalPax:         input.TotalPax,
		Message:          input.Message,
	})
	if err != nil {
		if errors.Is(err, service.ErrInvitationNotFoundForRSVP) {
			notFound(c, "invitation not found")
			return
		}
		serverError(c, err)
		return
	}
	created(c, rsvp)
}

// GET /api/v1/public/invitation/:slug/rsvp
func (h *RSVPHandler) ListPublic(c *gin.Context) {
	rsvps, err := h.svc.ListBySlug(c.Param("slug"))
	if err != nil {
		serverError(c, err)
		return
	}
	ok(c, rsvps)
}

// GET /api/v1/admin/invitation/:id/rsvp-list
func (h *RSVPHandler) List(c *gin.Context) {
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

	rsvps, err := h.svc.ListByInvitation(id, userID, h.invSvc)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvitationNotFound):
			notFound(c, "invitation not found")
		case errors.Is(err, service.ErrForbidden):
			forbidden(c)
		default:
			serverError(c, err)
		}
		return
	}
	ok(c, rsvps)
}

// DELETE /api/v1/admin/invitation/:id/rsvp/:rsvpId
func (h *RSVPHandler) Delete(c *gin.Context) {
	invitationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		badRequest(c, "invalid id")
		return
	}
	rsvpID, err := uuid.Parse(c.Param("rsvpId"))
	if err != nil {
		badRequest(c, "invalid rsvp id")
		return
	}
	userID, authOK := currentUserID(c)
	if !authOK {
		unauthorized(c, "unauthorized")
		return
	}

	if err := h.svc.Delete(invitationID, rsvpID, userID); err != nil {
		switch {
		case errors.Is(err, service.ErrInvitationNotFound), errors.Is(err, service.ErrRSVPNotFound):
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
