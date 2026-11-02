package router

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"wedding-invitation-be/handler"
	"wedding-invitation-be/middleware"
)

func Setup(
	authH *handler.AuthHandler,
	invH *handler.InvitationHandler,
	rsvpH *handler.RSVPHandler,
	uploadH *handler.UploadHandler,
) *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: false,
	}))
	r.MaxMultipartMemory = 8 << 20

	v1 := r.Group("/api/v1")

	// Auth
	auth := v1.Group("/auth")
	{
		auth.POST("/register", authH.Register)
		auth.POST("/login", authH.Login)
	}

	// Public
	public := v1.Group("/public")
	{
		public.GET("/invitation/:slug", invH.GetBySlug)
		public.POST("/invitation/:slug/view", invH.RecordView)
		public.GET("/invitation/:slug/rsvp", rsvpH.ListPublic)
		public.POST("/rsvp", rsvpH.Submit)
	}

	// Admin — JWT protected
	admin := v1.Group("/admin")
	admin.Use(middleware.JWTAuth())
	{
		admin.POST("/invitation", invH.Create)
		admin.GET("/invitations", invH.ListMine)
		admin.GET("/invitation/:id", invH.GetByID)
		admin.PATCH("/invitation/:id", invH.Update)
		admin.DELETE("/invitation/:id", invH.Delete)
		admin.GET("/invitation/:id/rsvp-list", rsvpH.List)
		admin.DELETE("/invitation/:id/rsvp/:rsvpId", rsvpH.Delete)
		admin.POST("/upload/image", uploadH.UploadImage)
		admin.DELETE("/invitation/:id/media", uploadH.Delete)
	}

	return r
}
