package handler

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"wedding-invitation-be/service"
)

type UploadHandler struct {
	svc    service.UploadService
	invSvc service.InvitationService
}

func NewUploadHandler(svc service.UploadService, invSvc service.InvitationService) *UploadHandler {
	return &UploadHandler{svc: svc, invSvc: invSvc}
}

func (h *UploadHandler) UploadImage(c *gin.Context) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		badRequest(c, "file field is required")
		return
	}

	const maxSize = 5 << 20
	if fileHeader.Size > maxSize {
		c.JSON(http.StatusRequestEntityTooLarge, envelope{
			Status:  "error",
			Message: fmt.Sprintf("file too large (max %dMB)", maxSize>>20),
		})
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		serverError(c, err)
		return
	}
	defer file.Close()

	url, err := h.svc.UploadImage(file, fileHeader)
	if err != nil {
		badRequest(c, err.Error())
		return
	}

	ok(c, gin.H{"url": url})
}

// DELETE /api/v1/admin/invitation/:id/media
func (h *UploadHandler) Delete(c *gin.Context) {
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
		URL string `json:"url" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		badRequest(c, err.Error())
		return
	}

	// Ownership gate mirrors the invitation Update/Delete handlers.
	if err := h.invSvc.CheckOwner(id, userID); err != nil {
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

	if err := h.svc.DeleteObject(input.URL); err != nil {
		badRequest(c, err.Error())
		return
	}
	ok(c, gin.H{"deleted": true})
}
