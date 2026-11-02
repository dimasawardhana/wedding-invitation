package main

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"wedding-invitation-be/domain"
	"wedding-invitation-be/handler"
	"wedding-invitation-be/repository"
	"wedding-invitation-be/router"
	"wedding-invitation-be/service"
)

func main() {
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=secret dbname=wedding_db port=5432 sslmode=disable"
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	if err := db.AutoMigrate(&domain.User{}, &domain.Invitation{}, &domain.RSVP{}); err != nil {
		log.Fatalf("failed to migrate: %v", err)
	}

	// Backfill created_at for rows written before the column was tracked.
	if err := db.Exec("UPDATE invitations SET created_at = updated_at WHERE created_at IS NULL").Error; err != nil {
		log.Fatalf("failed to backfill invitation created_at: %v", err)
	}

	userRepo := repository.NewUserRepository(db)
	invRepo := repository.NewInvitationRepository(db)
	rsvpRepo := repository.NewRSVPRepository(db)

	authSvc := service.NewAuthService(userRepo)
	invSvc := service.NewInvitationService(invRepo)
	rsvpSvc := service.NewRSVPService(rsvpRepo, invRepo)
	uploadSvc := service.NewUploadService()

	authH := handler.NewAuthHandler(authSvc)
	invH := handler.NewInvitationHandler(invSvc)
	rsvpH := handler.NewRSVPHandler(rsvpSvc, invSvc)
	uploadH := handler.NewUploadHandler(uploadSvc, invSvc)

	r := router.Setup(authH, invH, rsvpH, uploadH)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server starting on :%s", port)
	if err := r.Run(fmt.Sprintf(":%s", port)); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
