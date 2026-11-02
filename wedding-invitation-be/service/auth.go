package service

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"wedding-invitation-be/domain"
	"wedding-invitation-be/repository"
)

var (
	ErrEmailTaken   = errors.New("email already registered")
	ErrInvalidCreds = errors.New("invalid email or password")
)

type AuthService interface {
	Register(name, email, password string) (*domain.User, string, error)
	Login(email, password string) (*domain.User, string, error)
}

type authService struct {
	userRepo repository.UserRepository
}

func NewAuthService(userRepo repository.UserRepository) AuthService {
	return &authService{userRepo: userRepo}
}

func (s *authService) Register(name, email, password string) (*domain.User, string, error) {
	existing, err := s.userRepo.FindByEmail(email)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, "", err
	}
	if existing != nil {
		return nil, "", ErrEmailTaken
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", err
	}

	user := &domain.User{
		Name:     name,
		Email:    email,
		Password: string(hash),
	}
	if err := s.userRepo.Create(user); err != nil {
		return nil, "", err
	}

	token, err := generateToken(user.ID)
	if err != nil {
		return nil, "", err
	}
	return user, token, nil
}

func (s *authService) Login(email, password string) (*domain.User, string, error) {
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", ErrInvalidCreds
		}
		return nil, "", err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, "", ErrInvalidCreds
	}

	token, err := generateToken(user.ID)
	if err != nil {
		return nil, "", err
	}
	return user, token, nil
}

func generateToken(userID uuid.UUID) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dev-secret-change-in-production"
	}
	claims := jwt.MapClaims{
		"sub": userID.String(),
		"exp": time.Now().Add(72 * time.Hour).Unix(),
		"iat": time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}
