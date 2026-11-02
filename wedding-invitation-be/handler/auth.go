package handler

import (
	"errors"

	"github.com/gin-gonic/gin"
	"wedding-invitation-be/service"
)

type AuthHandler struct {
	svc service.AuthService
}

func NewAuthHandler(svc service.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var input struct {
		Name     string `json:"name" binding:"required"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		badRequest(c, err.Error())
		return
	}

	user, token, err := h.svc.Register(input.Name, input.Email, input.Password)
	if err != nil {
		if errors.Is(err, service.ErrEmailTaken) {
			conflict(c, err.Error())
			return
		}
		serverError(c, err)
		return
	}
	created(c, gin.H{"user": user, "token": token})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		badRequest(c, err.Error())
		return
	}

	user, token, err := h.svc.Login(input.Email, input.Password)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCreds) {
			unauthorized(c, err.Error())
			return
		}
		serverError(c, err)
		return
	}
	ok(c, gin.H{"user": user, "token": token})
}
