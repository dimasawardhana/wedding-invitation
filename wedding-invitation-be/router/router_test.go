package router_test

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"wedding-invitation-be/domain"
	"wedding-invitation-be/handler"
	"wedding-invitation-be/router"
	"wedding-invitation-be/service"
)

// ---------------------------------------------------------------------------
// Response envelope, mirroring handler/response.go
// ---------------------------------------------------------------------------

type envelope struct {
	Status  string          `json:"status"`
	Data    json.RawMessage `json:"data"`
	Message string          `json:"message"`
}

const (
	testEmail    = "owner@example.com"
	testPassword = "secret123"
)

// ---------------------------------------------------------------------------
// In-memory repositories
// ---------------------------------------------------------------------------

type fakeUserRepo struct {
	byID    map[uuid.UUID]*domain.User
	byEmail map[string]*domain.User
}

func newFakeUserRepo() *fakeUserRepo {
	return &fakeUserRepo{byID: map[uuid.UUID]*domain.User{}, byEmail: map[string]*domain.User{}}
}

func (r *fakeUserRepo) Create(user *domain.User) error {
	if _, exists := r.byEmail[user.Email]; exists {
		return errors.New("duplicate email")
	}
	if user.ID == uuid.Nil {
		user.ID = uuid.New()
	}
	r.byID[user.ID] = user
	r.byEmail[user.Email] = user
	return nil
}

func (r *fakeUserRepo) FindByEmail(email string) (*domain.User, error) {
	user, ok := r.byEmail[email]
	if !ok {
		return nil, gorm.ErrRecordNotFound
	}
	return user, nil
}

func (r *fakeUserRepo) FindByID(id uuid.UUID) (*domain.User, error) {
	user, ok := r.byID[id]
	if !ok {
		return nil, gorm.ErrRecordNotFound
	}
	return user, nil
}

type fakeInvitationRepo struct {
	byID   map[uuid.UUID]*domain.Invitation
	bySlug map[string]uuid.UUID
}

func newFakeInvitationRepo() *fakeInvitationRepo {
	return &fakeInvitationRepo{byID: map[uuid.UUID]*domain.Invitation{}, bySlug: map[string]uuid.UUID{}}
}

func (r *fakeInvitationRepo) Create(inv *domain.Invitation) error {
	if inv.ID == uuid.Nil {
		inv.ID = uuid.New()
	}
	r.byID[inv.ID] = inv
	r.bySlug[inv.Slug] = inv.ID
	return nil
}

func (r *fakeInvitationRepo) FindAll() ([]domain.Invitation, error) {
	out := make([]domain.Invitation, 0, len(r.byID))
	for _, inv := range r.byID {
		out = append(out, *inv)
	}
	return out, nil
}

func (r *fakeInvitationRepo) FindByID(id uuid.UUID) (*domain.Invitation, error) {
	inv, ok := r.byID[id]
	if !ok {
		return nil, gorm.ErrRecordNotFound
	}
	return inv, nil
}

func (r *fakeInvitationRepo) FindBySlug(slug string) (*domain.Invitation, error) {
	id, ok := r.bySlug[slug]
	if !ok {
		return nil, gorm.ErrRecordNotFound
	}
	return r.byID[id], nil
}

func (r *fakeInvitationRepo) IncrementViews(id uuid.UUID) (int64, error) {
	inv, ok := r.byID[id]
	if !ok {
		return 0, gorm.ErrRecordNotFound
	}
	inv.Views++
	return inv.Views, nil
}

func (r *fakeInvitationRepo) FindByUserID(userID uuid.UUID) ([]domain.Invitation, error) {
	out := []domain.Invitation{}
	for _, inv := range r.byID {
		if inv.UserID == userID {
			out = append(out, *inv)
		}
	}
	return out, nil
}

func (r *fakeInvitationRepo) Update(inv *domain.Invitation) error {
	if _, ok := r.byID[inv.ID]; !ok {
		return gorm.ErrRecordNotFound
	}
	r.byID[inv.ID] = inv
	r.bySlug[inv.Slug] = inv.ID
	return nil
}

func (r *fakeInvitationRepo) Delete(id uuid.UUID) error {
	inv, ok := r.byID[id]
	if !ok {
		return gorm.ErrRecordNotFound
	}
	delete(r.bySlug, inv.Slug)
	delete(r.byID, id)
	return nil
}

func (r *fakeInvitationRepo) SlugExists(slug string, excludeID *uuid.UUID) (bool, error) {
	id, ok := r.bySlug[slug]
	if !ok {
		return false, nil
	}
	if excludeID != nil && id == *excludeID {
		return false, nil
	}
	return true, nil
}

type fakeRSVPRepo struct {
	rows []domain.RSVP
}

func newFakeRSVPRepo() *fakeRSVPRepo { return &fakeRSVPRepo{} }

func (r *fakeRSVPRepo) Create(rsvp *domain.RSVP) error {
	if rsvp.ID == uuid.Nil {
		rsvp.ID = uuid.New()
	}
	r.rows = append(r.rows, *rsvp)
	return nil
}

func (r *fakeRSVPRepo) FindByInvitationID(invitationID uuid.UUID) ([]domain.RSVP, error) {
	out := []domain.RSVP{}
	for _, row := range r.rows {
		if row.InvitationID == invitationID {
			out = append(out, row)
		}
	}
	return out, nil
}

func (r *fakeRSVPRepo) ListBySlug(string) ([]domain.RSVP, error) {
	return append([]domain.RSVP{}, r.rows...), nil
}

// Delete mirrors the real repository: scoped to the invitation, reporting
// gorm.ErrRecordNotFound when nothing matched.
func (r *fakeRSVPRepo) Delete(invitationID, id uuid.UUID) error {
	for i, row := range r.rows {
		if row.ID == id && row.InvitationID == invitationID {
			r.rows = append(r.rows[:i], r.rows[i+1:]...)
			return nil
		}
	}
	return gorm.ErrRecordNotFound
}

// ---------------------------------------------------------------------------
// Fake upload service — the real one needs MinIO
// ---------------------------------------------------------------------------

type fakeUploadService struct {
	deleted []string
	err     error
}

func (s *fakeUploadService) UploadImage(multipart.File, *multipart.FileHeader) (string, error) {
	return "", errors.New("UploadImage is not exercised by these tests")
}

func (s *fakeUploadService) DeleteObject(url string) error {
	if s.err != nil {
		return s.err
	}
	s.deleted = append(s.deleted, url)
	return nil
}

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

type harness struct {
	engine    *gin.Engine
	invRepo   *fakeInvitationRepo
	uploadSvc *fakeUploadService
}

func newHarness(t *testing.T) *harness {
	t.Helper()
	h := &harness{
		invRepo:   newFakeInvitationRepo(),
		uploadSvc: &fakeUploadService{},
	}
	userRepo := newFakeUserRepo()
	rsvpRepo := newFakeRSVPRepo()

	authSvc := service.NewAuthService(userRepo)
	invSvc := service.NewInvitationService(h.invRepo)
	rsvpSvc := service.NewRSVPService(rsvpRepo, h.invRepo)

	h.engine = router.Setup(
		handler.NewAuthHandler(authSvc),
		handler.NewInvitationHandler(invSvc),
		handler.NewRSVPHandler(rsvpSvc, invSvc),
		handler.NewUploadHandler(h.uploadSvc, invSvc),
	)

	h.register(t, "Owner", testEmail, testPassword)
	return h
}

// withRealUploadService swaps in the production upload service, so the URL guard
// in DeleteObject runs against real code. No S3 call happens on a rejected URL.
func (h *harness) withRealUploadService(t *testing.T) {
	t.Helper()
	userRepo := newFakeUserRepo()
	authSvc := service.NewAuthService(userRepo)
	invSvc := service.NewInvitationService(h.invRepo)
	rsvpSvc := service.NewRSVPService(newFakeRSVPRepo(), h.invRepo)
	h.engine = router.Setup(
		handler.NewAuthHandler(authSvc),
		handler.NewInvitationHandler(invSvc),
		handler.NewRSVPHandler(rsvpSvc, invSvc),
		handler.NewUploadHandler(service.NewUploadService(), invSvc),
	)
}

func (h *harness) register(t *testing.T, name, email, password string) string {
	t.Helper()
	rec := h.do(t, http.MethodPost, "/api/v1/auth/register", "",
		map[string]any{"name": name, "email": email, "password": password})
	if rec.Code != http.StatusCreated {
		t.Fatalf("register %s: status = %d, body = %s", email, rec.Code, rec.Body.String())
	}
	var env envelope
	decode(t, rec, &env)
	var payload struct {
		Token string `json:"token"`
	}
	if err := json.Unmarshal(env.Data, &payload); err != nil {
		t.Fatalf("register payload: %v", err)
	}
	return payload.Token
}

func (h *harness) do(t *testing.T, method, path, token string, body any) *httptest.ResponseRecorder {
	t.Helper()
	var reader *bytes.Reader
	if body == nil {
		reader = bytes.NewReader(nil)
	} else {
		raw, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("marshal body: %v", err)
		}
		reader = bytes.NewReader(raw)
	}
	req := httptest.NewRequest(method, path, reader)
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	rec := httptest.NewRecorder()
	h.engine.ServeHTTP(rec, req)
	return rec
}

func decode(t *testing.T, rec *httptest.ResponseRecorder, env *envelope) {
	t.Helper()
	if err := json.Unmarshal(rec.Body.Bytes(), env); err != nil {
		t.Fatalf("decode envelope: %v (body=%s)", err, rec.Body.String())
	}
}

// wantStatus asserts the HTTP status and the documented envelope contract.
func wantStatus(t *testing.T, rec *httptest.ResponseRecorder, want int) envelope {
	t.Helper()
	if rec.Code != want {
		t.Fatalf("status = %d, want %d (body=%s)", rec.Code, want, rec.Body.String())
	}
	var env envelope
	decode(t, rec, &env)
	if want < 400 {
		if env.Status != "success" {
			t.Fatalf("envelope status = %q, want \"success\" (body=%s)", env.Status, rec.Body.String())
		}
		return env
	}
	if env.Status != "error" {
		t.Fatalf("envelope status = %q, want \"error\" (body=%s)", env.Status, rec.Body.String())
	}
	if env.Message == "" {
		t.Fatalf("error envelope carries an empty message (body=%s)", rec.Body.String())
	}
	return env
}

// createInvitation registers a fresh owner and creates one invitation for them.
func (h *harness) createInvitation(t *testing.T, email, slug string) (token string, id uuid.UUID) {
	t.Helper()
	token = h.register(t, "Owner", email, testPassword)
	rec := h.do(t, http.MethodPost, "/api/v1/admin/invitation", token, map[string]any{
		"slug":         slug,
		"layout_id":    "storyteller",
		"theme_config": map[string]any{"colorScheme": "gold-ivory", "fontPair": "playfair-geist"},
	})
	env := wantStatus(t, rec, http.StatusCreated)
	var inv domain.Invitation
	if err := json.Unmarshal(env.Data, &inv); err != nil {
		t.Fatalf("decode invitation: %v", err)
	}
	if inv.ID == uuid.Nil {
		t.Fatal("created invitation has no id")
	}
	return token, inv.ID
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

func TestAdminRoutesRequireToken(t *testing.T) {
	h := newHarness(t)

	for _, tc := range []struct {
		name  string
		token string
	}{
		{"missing header", ""},
		{"malformed token", "not-a-jwt"},
		{"valid shape, wrong signing key", foreignSignedToken(t)},
	} {
		t.Run(tc.name, func(t *testing.T) {
			rec := h.do(t, http.MethodGet, "/api/v1/admin/invitations", tc.token, nil)
			wantStatus(t, rec, http.StatusUnauthorized)
		})
	}
}

func TestRegisterAndLogin(t *testing.T) {
	h := newHarness(t)

	t.Run("duplicate email is 409", func(t *testing.T) {
		rec := h.do(t, http.MethodPost, "/api/v1/auth/register", "", map[string]any{
			"name": "Owner", "email": testEmail, "password": testPassword,
		})
		wantStatus(t, rec, http.StatusConflict)
	})

	t.Run("short password is 400", func(t *testing.T) {
		rec := h.do(t, http.MethodPost, "/api/v1/auth/register", "", map[string]any{
			"name": "Short", "email": "short@example.com", "password": "123",
		})
		wantStatus(t, rec, http.StatusBadRequest)
	})

	t.Run("wrong password is 401", func(t *testing.T) {
		rec := h.do(t, http.MethodPost, "/api/v1/auth/login", "", map[string]any{
			"email": testEmail, "password": "not-the-password",
		})
		wantStatus(t, rec, http.StatusUnauthorized)
	})

	t.Run("right password returns a token and never the hash", func(t *testing.T) {
		rec := h.do(t, http.MethodPost, "/api/v1/auth/login", "", map[string]any{
			"email": testEmail, "password": testPassword,
		})
		env := wantStatus(t, rec, http.StatusOK)
		var payload struct {
			Token string `json:"token"`
			User  struct {
				Password string `json:"password"`
			} `json:"user"`
		}
		if err := json.Unmarshal(env.Data, &payload); err != nil {
			t.Fatalf("login payload: %v", err)
		}
		if payload.Token == "" {
			t.Fatal("login returned an empty token")
		}
		if payload.User.Password != "" {
			t.Error("login response leaks the password hash")
		}
		wantStatus(t, h.do(t, http.MethodGet, "/api/v1/admin/invitations", payload.Token, nil), http.StatusOK)
	})
}

// ---------------------------------------------------------------------------
// Admin invitation contract
// ---------------------------------------------------------------------------

func TestInvitationCreateValidation(t *testing.T) {
	h := newHarness(t)
	token, _ := h.createInvitation(t, "creator@example.com", "creator-slug")

	t.Run("missing slug is 400", func(t *testing.T) {
		rec := h.do(t, http.MethodPost, "/api/v1/admin/invitation", token, map[string]any{"layout_id": "storyteller"})
		wantStatus(t, rec, http.StatusBadRequest)
	})

	t.Run("duplicate slug is 409", func(t *testing.T) {
		rec := h.do(t, http.MethodPost, "/api/v1/admin/invitation", token, map[string]any{"slug": "creator-slug"})
		wantStatus(t, rec, http.StatusConflict)
	})
}

func TestListMineIsScopedToTheCaller(t *testing.T) {
	h := newHarness(t)
	tokenA, _ := h.createInvitation(t, "a@example.com", "slug-a")
	_, _ = h.createInvitation(t, "b@example.com", "slug-b")

	env := wantStatus(t, h.do(t, http.MethodGet, "/api/v1/admin/invitations", tokenA, nil), http.StatusOK)
	var list []domain.Invitation
	if err := json.Unmarshal(env.Data, &list); err != nil {
		t.Fatalf("decode list: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("list length = %d, want 1 — another user's invitation leaked", len(list))
	}
	if list[0].Slug != "slug-a" {
		t.Fatalf("list[0].slug = %q, want \"slug-a\"", list[0].Slug)
	}
}

func TestGetInvitationByID(t *testing.T) {
	h := newHarness(t)
	token, id := h.createInvitation(t, "get@example.com", "get-slug")

	t.Run("known id", func(t *testing.T) {
		env := wantStatus(t, h.do(t, http.MethodGet, "/api/v1/admin/invitation/"+id.String(), token, nil), http.StatusOK)
		var inv domain.Invitation
		if err := json.Unmarshal(env.Data, &inv); err != nil {
			t.Fatalf("decode: %v", err)
		}
		if inv.Slug != "get-slug" {
			t.Fatalf("slug = %q, want \"get-slug\"", inv.Slug)
		}
	})

	t.Run("unknown id is 404", func(t *testing.T) {
		rec := h.do(t, http.MethodGet, "/api/v1/admin/invitation/"+uuid.New().String(), token, nil)
		wantStatus(t, rec, http.StatusNotFound)
	})

	t.Run("malformed id is 400", func(t *testing.T) {
		rec := h.do(t, http.MethodGet, "/api/v1/admin/invitation/not-a-uuid", token, nil)
		wantStatus(t, rec, http.StatusBadRequest)
	})
}

func TestPatchInvitation(t *testing.T) {
	h := newHarness(t)
	token, id := h.createInvitation(t, "patch@example.com", "patch-slug")
	otherToken, _ := h.createInvitation(t, "intruder@example.com", "intruder-slug")
	path := "/api/v1/admin/invitation/" + id.String()

	t.Run("theme, music and slug persist", func(t *testing.T) {
		env := wantStatus(t, h.do(t, http.MethodPatch, path, token, map[string]any{
			"slug":         "patch-slug-2",
			"theme_config": map[string]any{"colorScheme": "terracotta", "fontPair": "cormorant-inter"},
			"music_url":    "https://example.com/song.mp3",
		}), http.StatusOK)

		var inv domain.Invitation
		if err := json.Unmarshal(env.Data, &inv); err != nil {
			t.Fatalf("decode: %v", err)
		}
		if inv.Slug != "patch-slug-2" {
			t.Errorf("slug = %q, want \"patch-slug-2\"", inv.Slug)
		}
		if inv.MusicURL != "https://example.com/song.mp3" {
			t.Errorf("music_url = %q", inv.MusicURL)
		}
		if !bytes.Contains(inv.ThemeConfig, []byte("terracotta")) {
			t.Errorf("theme_config = %s, want terracotta", inv.ThemeConfig)
		}
	})

	t.Run("gallery round-trips", func(t *testing.T) {
		gallery := []map[string]string{
			{"id": "img-1", "url": "http://localhost:9000/wedding-uploads/images/1.png", "caption": "e2e caption"},
		}
		env := wantStatus(t, h.do(t, http.MethodPatch, path, token, map[string]any{"gallery": gallery}), http.StatusOK)

		var inv domain.Invitation
		if err := json.Unmarshal(env.Data, &inv); err != nil {
			t.Fatalf("decode: %v", err)
		}
		var got []map[string]string
		if err := json.Unmarshal(inv.Gallery, &got); err != nil {
			t.Fatalf("gallery json: %v", err)
		}
		if len(got) != 1 || got[0]["caption"] != "e2e caption" {
			t.Fatalf("gallery = %s", inv.Gallery)
		}
	})

	t.Run("non-owner is 403", func(t *testing.T) {
		rec := h.do(t, http.MethodPatch, path, otherToken, map[string]any{"music_url": "https://evil.example/x.mp3"})
		wantStatus(t, rec, http.StatusForbidden)
	})

	t.Run("unknown id is 404", func(t *testing.T) {
		rec := h.do(t, http.MethodPatch, "/api/v1/admin/invitation/"+uuid.New().String(), token, map[string]any{"music_url": "x"})
		wantStatus(t, rec, http.StatusNotFound)
	})
}

func TestDeleteInvitation(t *testing.T) {
	h := newHarness(t)
	token, id := h.createInvitation(t, "del@example.com", "del-slug")
	otherToken, _ := h.createInvitation(t, "del-other@example.com", "del-other")
	path := "/api/v1/admin/invitation/" + id.String()

	t.Run("non-owner is 403 and the row survives", func(t *testing.T) {
		wantStatus(t, h.do(t, http.MethodDelete, path, otherToken, nil), http.StatusForbidden)
		wantStatus(t, h.do(t, http.MethodGet, path, token, nil), http.StatusOK)
	})

	t.Run("owner deletes and the row is gone", func(t *testing.T) {
		env := wantStatus(t, h.do(t, http.MethodDelete, path, token, nil), http.StatusOK)
		var payload struct {
			Deleted bool `json:"deleted"`
		}
		if err := json.Unmarshal(env.Data, &payload); err != nil {
			t.Fatalf("decode: %v", err)
		}
		if !payload.Deleted {
			t.Fatalf("deleted = false (body=%s)", env.Data)
		}
		wantStatus(t, h.do(t, http.MethodGet, path, token, nil), http.StatusNotFound)
	})

	t.Run("second delete is 404", func(t *testing.T) {
		wantStatus(t, h.do(t, http.MethodDelete, path, token, nil), http.StatusNotFound)
	})
}

// ---------------------------------------------------------------------------
// Media delete — the endpoint added for TASK-113
// ---------------------------------------------------------------------------

func TestDeleteMedia(t *testing.T) {
	h := newHarness(t)
	token, id := h.createInvitation(t, "media@example.com", "media-slug")
	otherToken, _ := h.createInvitation(t, "media-other@example.com", "media-other-slug")
	path := "/api/v1/admin/invitation/" + id.String() + "/media"
	const ownedURL = "http://localhost:9000/wedding-uploads/images/photo.png"

	t.Run("owner deletes a stored object", func(t *testing.T) {
		env := wantStatus(t, h.do(t, http.MethodDelete, path, token, map[string]any{"url": ownedURL}), http.StatusOK)
		var payload struct {
			Deleted bool `json:"deleted"`
		}
		if err := json.Unmarshal(env.Data, &payload); err != nil {
			t.Fatalf("decode: %v", err)
		}
		if !payload.Deleted {
			t.Fatalf("deleted = false (body=%s)", env.Data)
		}
		if len(h.uploadSvc.deleted) != 1 || h.uploadSvc.deleted[0] != ownedURL {
			t.Fatalf("storage delete calls = %v, want [%s]", h.uploadSvc.deleted, ownedURL)
		}
	})

	t.Run("non-owner is 403 and storage is untouched", func(t *testing.T) {
		before := len(h.uploadSvc.deleted)
		wantStatus(t, h.do(t, http.MethodDelete, path, otherToken, map[string]any{"url": ownedURL}), http.StatusForbidden)
		if len(h.uploadSvc.deleted) != before {
			t.Fatal("a non-owner reached the storage layer")
		}
	})

	t.Run("unknown invitation is 404", func(t *testing.T) {
		rec := h.do(t, http.MethodDelete,
			"/api/v1/admin/invitation/"+uuid.New().String()+"/media", token, map[string]any{"url": ownedURL})
		wantStatus(t, rec, http.StatusNotFound)
	})

	t.Run("missing url field is 400", func(t *testing.T) {
		wantStatus(t, h.do(t, http.MethodDelete, path, token, map[string]any{}), http.StatusBadRequest)
	})

	t.Run("storage failure surfaces as 400", func(t *testing.T) {
		h.uploadSvc.err = errors.New("delete failed: boom")
		t.Cleanup(func() { h.uploadSvc.err = nil })
		wantStatus(t, h.do(t, http.MethodDelete, path, token, map[string]any{"url": ownedURL}), http.StatusBadRequest)
	})

	t.Run("unauthenticated is 401", func(t *testing.T) {
		wantStatus(t, h.do(t, http.MethodDelete, path, "", map[string]any{"url": ownedURL}), http.StatusUnauthorized)
	})
}

// TestDeleteMediaRejectsForeignURL runs the production upload service: the URL
// guard rejects before any S3 call, so no MinIO is required.
func TestDeleteMediaRejectsForeignURL(t *testing.T) {
	t.Setenv("S3_PUBLIC_URL", "http://localhost:9000/wedding-uploads")
	t.Setenv("S3_BUCKET", "wedding-uploads")

	h := &harness{invRepo: newFakeInvitationRepo(), uploadSvc: &fakeUploadService{}}
	h.withRealUploadService(t)
	token, id := h.createInvitation(t, "realupload@example.com", "realupload-slug")
	path := "/api/v1/admin/invitation/" + id.String() + "/media"

	for _, tc := range []struct {
		name string
		url  string
	}{
		{"other host", "https://cdn.example.com/wedding-uploads/images/photo.png"},
		{"same host, different bucket", "http://localhost:9000/other-bucket/images/photo.png"},
		{"bare public base", "http://localhost:9000/wedding-uploads"},
		{"path traversal", "http://localhost:9000/wedding-uploads/../../etc/passwd"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			rec := h.do(t, http.MethodDelete, path, token, map[string]any{"url": tc.url})
			wantStatus(t, rec, http.StatusBadRequest)
		})
	}
}

// ---------------------------------------------------------------------------
// Public routes
// ---------------------------------------------------------------------------

func TestPublicInvitation(t *testing.T) {
	h := newHarness(t)
	_, _ = h.createInvitation(t, "public@example.com", "public-slug")

	t.Run("by slug", func(t *testing.T) {
		env := wantStatus(t, h.do(t, http.MethodGet, "/api/v1/public/invitation/public-slug", "", nil), http.StatusOK)
		var inv domain.Invitation
		if err := json.Unmarshal(env.Data, &inv); err != nil {
			t.Fatalf("decode: %v", err)
		}
		if inv.Slug != "public-slug" {
			t.Fatalf("slug = %q", inv.Slug)
		}
	})

	t.Run("unknown slug is 404", func(t *testing.T) {
		wantStatus(t, h.do(t, http.MethodGet, "/api/v1/public/invitation/nope", "", nil), http.StatusNotFound)
	})

	t.Run("view counter increments by one", func(t *testing.T) {
		countViews := func() int64 {
			env := wantStatus(t, h.do(t, http.MethodPost, "/api/v1/public/invitation/public-slug/view", "", nil), http.StatusOK)
			var payload struct {
				Views int64 `json:"views"`
			}
			if err := json.Unmarshal(env.Data, &payload); err != nil {
				t.Fatalf("decode: %v", err)
			}
			return payload.Views
		}
		before := countViews()
		if after := countViews(); after != before+1 {
			t.Fatalf("views went %d -> %d, want +1", before, after)
		}
	})

	t.Run("unknown slug view is 404", func(t *testing.T) {
		wantStatus(t, h.do(t, http.MethodPost, "/api/v1/public/invitation/nope/view", "", nil), http.StatusNotFound)
	})
}

func TestPublicRSVP(t *testing.T) {
	h := newHarness(t)
	_, id := h.createInvitation(t, "rsvp@example.com", "rsvp-slug")

	t.Run("submit is 201 and reads back on the public list", func(t *testing.T) {
		env := wantStatus(t, h.do(t, http.MethodPost, "/api/v1/public/rsvp", "", map[string]any{
			"invitation_id":     id.String(),
			"guest_name":        "Budi",
			"attendance_status": true,
			"total_pax":         2,
			"message":           "Selamat!",
		}), http.StatusCreated)

		var rsvp domain.RSVP
		if err := json.Unmarshal(env.Data, &rsvp); err != nil {
			t.Fatalf("decode: %v", err)
		}
		if rsvp.GuestName != "Budi" || rsvp.InvitationID != id {
			t.Fatalf("rsvp = %+v", rsvp)
		}

		listEnv := wantStatus(t, h.do(t, http.MethodGet, "/api/v1/public/invitation/rsvp-slug/rsvp", "", nil), http.StatusOK)
		var rows []domain.RSVP
		if err := json.Unmarshal(listEnv.Data, &rows); err != nil {
			t.Fatalf("decode list: %v", err)
		}
		if len(rows) != 1 || rows[0].GuestName != "Budi" {
			t.Fatalf("public rsvp list = %+v", rows)
		}
	})

	t.Run("unknown invitation is 404", func(t *testing.T) {
		rec := h.do(t, http.MethodPost, "/api/v1/public/rsvp", "", map[string]any{
			"invitation_id": uuid.New().String(), "guest_name": "Ghost",
		})
		wantStatus(t, rec, http.StatusNotFound)
	})

	t.Run("missing guest name is 400", func(t *testing.T) {
		rec := h.do(t, http.MethodPost, "/api/v1/public/rsvp", "", map[string]any{"invitation_id": id.String()})
		wantStatus(t, rec, http.StatusBadRequest)
	})

	t.Run("non-uuid invitation id is 400", func(t *testing.T) {
		rec := h.do(t, http.MethodPost, "/api/v1/public/rsvp", "", map[string]any{
			"invitation_id": "nope", "guest_name": "Budi",
		})
		wantStatus(t, rec, http.StatusBadRequest)
	})
}

// ---------------------------------------------------------------------------
// Admin RSVP routes
// ---------------------------------------------------------------------------

func TestAdminRSVPListAndDelete(t *testing.T) {
	h := newHarness(t)
	token, id := h.createInvitation(t, "guestadmin@example.com", "guestadmin-slug")
	otherToken, _ := h.createInvitation(t, "guestother@example.com", "guestother-slug")

	env := wantStatus(t, h.do(t, http.MethodPost, "/api/v1/public/rsvp", "", map[string]any{
		"invitation_id": id.String(), "guest_name": "Rina", "attendance_status": true, "total_pax": 3,
	}), http.StatusCreated)
	var rsvp domain.RSVP
	if err := json.Unmarshal(env.Data, &rsvp); err != nil {
		t.Fatalf("decode rsvp: %v", err)
	}

	listPath := "/api/v1/admin/invitation/" + id.String() + "/rsvp-list"
	deletePath := "/api/v1/admin/invitation/" + id.String() + "/rsvp/" + rsvp.ID.String()

	listNames := func(t *testing.T, tk string) []string {
		t.Helper()
		env := wantStatus(t, h.do(t, http.MethodGet, listPath, tk, nil), http.StatusOK)
		var rows []domain.RSVP
		if err := json.Unmarshal(env.Data, &rows); err != nil {
			t.Fatalf("decode: %v", err)
		}
		names := make([]string, 0, len(rows))
		for _, row := range rows {
			names = append(names, row.GuestName)
		}
		return names
	}

	t.Run("owner lists", func(t *testing.T) {
		if names := listNames(t, token); len(names) != 1 || names[0] != "Rina" {
			t.Fatalf("names = %v", names)
		}
	})

	t.Run("non-owner list is 403", func(t *testing.T) {
		wantStatus(t, h.do(t, http.MethodGet, listPath, otherToken, nil), http.StatusForbidden)
	})

	t.Run("non-owner delete is 403 and the row survives", func(t *testing.T) {
		wantStatus(t, h.do(t, http.MethodDelete, deletePath, otherToken, nil), http.StatusForbidden)
		if names := listNames(t, token); len(names) != 1 {
			t.Fatalf("rsvp disappeared after a rejected delete: %v", names)
		}
	})

	t.Run("owner delete removes it for good", func(t *testing.T) {
		wantStatus(t, h.do(t, http.MethodDelete, deletePath, token, nil), http.StatusOK)
		if names := listNames(t, token); len(names) != 0 {
			t.Fatalf("rows after delete = %v, want none", names)
		}
	})

	t.Run("deleting an unknown rsvp is 404", func(t *testing.T) {
		rec := h.do(t, http.MethodDelete, "/api/v1/admin/invitation/"+id.String()+"/rsvp/"+uuid.New().String(), token, nil)
		wantStatus(t, rec, http.StatusNotFound)
	})
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// foreignSignedToken is a structurally valid JWT signed with a key the server
// does not use, so the middleware must reject it on signature verification.
func foreignSignedToken(t *testing.T) string {
	t.Helper()
	enc := func(v any) string {
		raw, err := json.Marshal(v)
		if err != nil {
			t.Fatalf("marshal jwt segment: %v", err)
		}
		return base64.RawURLEncoding.EncodeToString(raw)
	}
	header := enc(map[string]string{"alg": "HS256", "typ": "JWT"})
	payload := enc(map[string]any{"sub": uuid.New().String(), "exp": 4102444800})
	return header + "." + payload + "." + base64.RawURLEncoding.EncodeToString([]byte("wrong-signature"))
}
