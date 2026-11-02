package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type envelope struct {
	Status  string      `json:"status"`
	Data    interface{} `json:"data"`
	Message string      `json:"message"`
}

func ok(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, envelope{Status: "success", Data: data})
}

func created(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, envelope{Status: "success", Data: data})
}

func deleted(c *gin.Context) {
	c.JSON(http.StatusOK, envelope{Status: "success", Data: gin.H{"deleted": true}})
}

func badRequest(c *gin.Context, msg string) {
	c.JSON(http.StatusBadRequest, envelope{Status: "error", Message: msg})
}

func unauthorized(c *gin.Context, msg string) {
	c.JSON(http.StatusUnauthorized, envelope{Status: "error", Message: msg})
}

func forbidden(c *gin.Context) {
	c.JSON(http.StatusForbidden, envelope{Status: "error", Message: "forbidden"})
}

func notFound(c *gin.Context, msg string) {
	c.JSON(http.StatusNotFound, envelope{Status: "error", Message: msg})
}

func conflict(c *gin.Context, msg string) {
	c.JSON(http.StatusConflict, envelope{Status: "error", Message: msg})
}

func serverError(c *gin.Context, err error) {
	c.JSON(http.StatusInternalServerError, envelope{Status: "error", Message: err.Error()})
}
