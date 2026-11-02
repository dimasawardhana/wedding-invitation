# AGENTS.md — Wedding Invitation Backend

## Stack

- **Framework**: Gin Gonic
- **ORM**: GORM + PostgreSQL driver (`gorm.io/driver/postgres`)
- **Auth**: JWT (`github.com/golang-jwt/jwt/v5`) + bcrypt (`golang.org/x/crypto/bcrypt`)
- **Language**: Go 1.26.1

## Architecture — Clean Layered

```
main.go              # Wires DB, repos, services, handlers, router
config/              # (reserved for future config helpers)
domain/              # GORM structs (user.go, invitation.go, rsvp.go)
repository/          # DB access — interfaces in repository.go + implementations
service/             # Business logic (auth.go, invitation.go, rsvp.go)
handler/             # HTTP handlers (response.go, auth.go, invitation.go, rsvp.go)
middleware/          # auth.go — JWTAuth() gin middleware
router/              # router.go — route registration
```

**Dependency direction**: `handler → service → repository → domain`. Never skip layers or import in reverse.

## Response Envelope (ALL endpoints)

```json
{ "status": "success|error", "data": {}, "message": "" }
```

Helpers live in `handler/response.go`: `ok`, `created`, `deleted`, `badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`, `serverError`.

## Models (`domain/`)

### User
- `ID` UUID, `Name`, `Email` (unique), `Password` (bcrypt, never returned in JSON — `json:"-"`)

### Invitation
- `ID` UUID, `UserID` UUID (FK → users, owner), `Slug` (unique), `LayoutID`, `ThemeConfig` JSONB, `MusicURL`
- JSONB content fields: `Couple`, `Events`, `Stories`, `Gallery`

### RSVP
- `ID` UUID, `InvitationID` UUID (FK → invitations), `GuestName`, `AttendanceStatus` bool, `TotalPax` int, `Message` text, `CreatedAt`

**All struct fields have `json:"snake_case"` tags.**

## API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/v1/auth/register` | None | Create account, returns JWT |
| POST | `/api/v1/auth/login` | None | Authenticate, returns JWT |
| GET | `/api/v1/public/invitation/:slug` | None | Fetch invitation for guest page |
| POST | `/api/v1/public/rsvp` | None | Submit RSVP |
| POST | `/api/v1/admin/invitation` | JWT | Create invitation |
| GET | `/api/v1/admin/invitations` | JWT | List caller's invitations |
| GET | `/api/v1/admin/invitation/:id` | JWT | Get invitation by ID |
| PATCH | `/api/v1/admin/invitation/:id` | JWT | Update invitation (owner only) |
| DELETE | `/api/v1/admin/invitation/:id` | JWT | Delete invitation (owner only) |
| GET | `/api/v1/admin/invitation/:id/rsvp-list` | JWT | List RSVPs (owner only) |
| DELETE | `/api/v1/admin/invitation/:id/rsvp/:rsvpId` | JWT | Delete an RSVP (owner only) |
| POST | `/api/v1/admin/upload/image` | JWT | Upload image → returns public URL |
| DELETE | `/api/v1/admin/invitation/:id/media` | JWT | Delete uploaded media object (owner only; body `{"url"}`; URL must be under `S3_PUBLIC_URL`) |

## Auth Rules

- Admin routes use `middleware.JWTAuth()` — validates `Authorization: Bearer <token>` header.
- `user_id` is injected into gin context as `uuid.UUID` via `c.Set("user_id", ...)`.
- Handlers read it with `c.Get("user_id")` and cast to `uuid.UUID`.
- Ownership: invitation `UserID` must match the JWT caller's ID; service layer returns `ErrForbidden` → handler returns `403`.
- JWT secret: `JWT_SECRET` env var; falls back to `"dev-secret-change-in-production"`.
- Token TTL: 72 hours.

## Critical Rules

1. **CORS**: All methods including `DELETE` and `OPTIONS`. Configured in `router/router.go`.
2. **Slug uniqueness**: `SlugExists(slug, excludeID)` in repository — called by service before write; returns 409 on conflict.
3. **HTTP status codes**: 404 not found, 400 bad request, 403 forbidden, 409 conflict, 500 server error — never 200 with error body.
4. **UUID primary keys**: `BeforeCreate` hook in each domain model auto-generates UUIDs.
5. **Ownership enforcement**: Always check `inv.UserID == callerUserID` in service layer, not handler layer.

## Dev Commands

```bash
go mod tidy           # After adding dependencies
go run .              # Start server (requires DB_DSN env)
go build -o server .  # Build binary

# Tests — handler/router contract, no DB or MinIO required
go test ./...                    # Full suite
go test ./router/... -v          # Contract tests, verbose
go test ./router/... -shuffle=on # Order independence

# Docker (recommended)
docker compose up --build -d   # Start API + Postgres
docker compose down            # Stop
docker compose logs -f api     # Tail API logs
```

`router/router_test.go` drives the real gin router through `httptest` with
in-memory repositories, so the suite is green on a clean checkout. It pins the
status codes and envelope shape of every route — extend it when adding or
changing one.

## Docker Notes

- Dockerfile: `golang:1.26-alpine` builder → `alpine:3.20` runtime.
- `go.mod` requires `go 1.26.1` — older builder images will fail at `go mod download`.
- `docker-compose.yml` healthcheck ensures API waits for DB readiness.
- **Migration caveat**: adding `NOT NULL` columns to tables with existing rows will fail. Drop tables first in dev: `DROP TABLE IF EXISTS rsvps, invitations, users CASCADE;`
- **MinIO**: S3-compatible object store on port `9000` (API) and `9001` (console). Bucket `wedding-uploads` is created automatically by `minio-init` on first boot and set to public read.

## Environment Variables

```
DB_DSN=host=localhost user=postgres password=secret dbname=wedding_db port=5432 sslmode=disable
PORT=8080
JWT_SECRET=change-this-in-production
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=wedding-uploads
S3_PUBLIC_URL=http://localhost:9000/wedding-uploads
```

## Dependencies

```
github.com/gin-gonic/gin
github.com/gin-contrib/cors
gorm.io/gorm
gorm.io/driver/postgres
gorm.io/datatypes
github.com/google/uuid
github.com/golang-jwt/jwt/v5
golang.org/x/crypto
github.com/aws/aws-sdk-go-v2/service/s3
```

## GORM Notes

- `db.AutoMigrate(&domain.User{}, &domain.Invitation{}, &domain.RSVP{})` in `main.go`.
- JSONB fields: use `datatypes.JSON`, not `string`.
- `Password` field on `User` has `json:"-"` — GORM writes it, JSON never exposes it.
