# API Reference — Wedding Invitation Backend

**Base URL:** `http://localhost:8080`  
**Content-Type:** `application/json` (all requests and responses)

---

## Authentication

Admin endpoints are protected with **JWT Bearer tokens**.

1. Obtain a token via `POST /api/v1/auth/register` or `POST /api/v1/auth/login`.
2. Pass the token in every admin request: `Authorization: Bearer <token>`.
3. Tokens expire after **72 hours**.
4. Each invitation is owned by the user who created it. Attempts to modify or delete another user's invitation return `403 Forbidden`.

---

## Response Envelope

Every response, success or error, is wrapped in this shape:

```json
{
  "status": "success | error",
  "data": {} | [] | null,
  "message": ""
}
```

| Field | Type | Description |
|---|---|---|
| `status` | string | `"success"` or `"error"` |
| `data` | any | Payload on success; `null` on error |
| `message` | string | Empty string on success; error description on error |

---

## Data Models

### User

```json
{
  "id": "afa19869-f75c-486f-92aa-4f6f4f09d8d3",
  "name": "Alice",
  "email": "alice@example.com",
  "created_at": "2026-04-29T16:56:05.526167Z",
  "updated_at": "2026-04-29T16:56:05.526167Z"
}
```

> `password` is never returned in any response.

---

### Invitation

```json
{
  "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "user_id": "afa19869-f75c-486f-92aa-4f6f4f09d8d3",
  "slug": "our-wedding-2026",
  "layout_id": "layout-01",
  "theme_config": { "primaryColor": "#e8b4b8", "font": "Playfair Display" },
  "music_url": "https://example.com/song.mp3",
  "couple": { "bride": "Jane", "groom": "John" },
  "events": [{ "name": "Ceremony", "time": "10:00", "venue": "Garden Hall" }],
  "stories": [{ "title": "How we met", "body": "..." }],
  "gallery": [{ "url": "https://example.com/photo1.jpg" }],
  "created_at": "2026-04-27T17:13:25.919981Z",
  "updated_at": "2026-04-27T17:13:38.456363Z"
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Auto-generated, read-only |
| `user_id` | string (UUID) | Owner — set automatically from JWT on create |
| `slug` | string | URL-safe identifier, unique across the platform |
| `layout_id` | string | References a frontend layout template |
| `theme_config` | object (JSONB) | Free-form JSON; shape defined by frontend |
| `music_url` | string | Direct audio file URL |
| `couple` | object (JSONB) | Free-form JSON |
| `events` | array (JSONB) | Free-form JSON array |
| `stories` | array (JSONB) | Free-form JSON array |
| `gallery` | array (JSONB) | Free-form JSON array |
| `views` | integer | Public page open counter — incremented by `POST /api/v1/public/invitation/:slug/view`, read-only |
| `created_at` | string (RFC3339) | Auto-set, read-only |

---

### RSVP

```json
{
  "id": "b3a2f592-f44d-4a26-a02f-205441f7293a",
  "invitation_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "guest_name": "John Doe",
  "attendance_status": true,
  "total_pax": 2,
  "message": "So excited to celebrate with you!",
  "created_at": "2026-04-27T17:13:33.306503Z"
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Auto-generated, read-only |
| `invitation_id` | string (UUID) | Foreign key to `Invitation.id` |
| `guest_name` | string | — |
| `attendance_status` | boolean | `true` = attending |
| `total_pax` | integer | Number of people attending with guest |
| `message` | string | Optional wish or note |
| `created_at` | string (RFC3339) | Auto-set, read-only |

---

## Auth Endpoints

### POST `/api/v1/auth/register`

Create a new user account and return a JWT token.

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | **Yes** | Display name |
| `email` | string | **Yes** | Must be unique, valid email format |
| `password` | string | **Yes** | Minimum 6 characters |

**Response — 201 Created**

```json
{
  "status": "success",
  "data": {
    "user": { /* User object */ },
    "token": "<jwt>"
  },
  "message": ""
}
```

**Status Codes**

| Code | Meaning |
|---|---|
| `201` | User created; token returned |
| `400` | Validation error (missing field, invalid email, short password) |
| `409` | Email already registered |
| `500` | Server error |

**Example**

```bash
curl -s -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"secret123"}'
```

```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGci...",
    "user": {
      "id": "afa19869-f75c-486f-92aa-4f6f4f09d8d3",
      "name": "Alice",
      "email": "alice@example.com",
      "created_at": "2026-04-29T16:56:05.526167Z",
      "updated_at": "2026-04-29T16:56:05.526167Z"
    }
  },
  "message": ""
}
```

---

### POST `/api/v1/auth/login`

Authenticate an existing user and return a JWT token.

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `email` | string | **Yes** | — |
| `password` | string | **Yes** | — |

**Response — 200 OK**

```json
{
  "status": "success",
  "data": { "user": { /* User object */ }, "token": "<jwt>" },
  "message": ""
}
```

**Status Codes**

| Code | Meaning |
|---|---|
| `200` | Credentials valid; token returned |
| `400` | Validation error |
| `401` | Invalid email or password |
| `500` | Server error |

**Example**

```bash
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123"}'
```

---

## Public Endpoints

### GET `/api/v1/public/invitation/:slug`

Fetch a full invitation record by its slug. Used by the guest-facing page.

**Path Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `slug` | string | Yes | The invitation's unique slug |

**Request Headers**

None required.

**Response — 200 OK**

```json
{
  "status": "success",
  "data": { /* Invitation object */ },
  "message": ""
}
```

**Status Codes**

| Code | Meaning |
|---|---|
| `200` | Invitation found and returned |
| `404` | No invitation exists with the given slug |
| `500` | Database or server error |

**Example**

```bash
curl -s http://localhost:8080/api/v1/public/invitation/our-wedding-2026
```

```json
{
  "status": "success",
  "data": {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "slug": "our-wedding-2026",
    "layout_id": "layout-01",
    "theme_config": { "primaryColor": "#e8b4b8", "font": "Playfair Display" },
    "music_url": "https://example.com/song.mp3",
    "couple": { "bride": "Jane", "groom": "John" },
    "events": [{ "name": "Ceremony", "time": "10:00", "venue": "Garden Hall" }],
    "stories": null,
    "gallery": null,
    "created_at": "2026-04-27T17:13:25.919981Z",
    "updated_at": "2026-04-27T17:13:38.456363Z"
  },
  "message": ""
}
```

---

### POST `/api/v1/public/rsvp`

Submit a guest RSVP for an invitation.

**Request Headers**

| Header | Value |
|---|---|
| `Content-Type` | `application/json` |

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `invitation_id` | string (UUID) | **Yes** | The invitation the guest is RSVPing to |
| `guest_name` | string | **Yes** | Full name of the guest |
| `attendance_status` | boolean | No | `true` = attending. Defaults to `false` |
| `total_pax` | integer | No | Number of seats needed. Defaults to `0` |
| `message` | string | No | Optional wish or note |

**Response — 201 Created**

```json
{
  "status": "success",
  "data": { /* RSVP object */ },
  "message": ""
}
```

**Status Codes**

| Code | Meaning |
|---|---|
| `201` | RSVP created successfully |
| `400` | Missing required field, or `invitation_id` is not a valid UUID |
| `404` | No invitation found with the given `invitation_id` |
| `500` | Database or server error |

**Example**

```bash
curl -s -X POST http://localhost:8080/api/v1/public/rsvp \
  -H "Content-Type: application/json" \
  -d '{
    "invitation_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "guest_name": "John Doe",
    "attendance_status": true,
    "total_pax": 2,
    "message": "So excited to celebrate with you!"
  }'
```

```json
{
  "status": "success",
  "data": {
    "id": "b3a2f592-f44d-4a26-a02f-205441f7293a",
    "invitation_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "guest_name": "John Doe",
    "attendance_status": true,
    "total_pax": 2,
    "message": "So excited to celebrate with you!",
    "created_at": "2026-04-27T17:13:33.306503Z"
  },
  "message": ""
}
```


---

### GET `/api/v1/public/invitation/:slug/rsvp`

Fetch all RSVP submissions for an invitation by its **public slug** — no authentication required. Used by the guest-facing wishes wall. Ordered by `created_at` descending (newest first).

**Path Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `slug` | string | Yes | The invitation's unique slug |

**Request Headers**

None required.

**Response — 200 OK**

Returns an array of `RSVP` objects (empty array if no RSVPs yet).

**Status Codes**

| Code | Meaning |
|---|---|
| `200` | RSVP list returned (may be empty array) |
| `404` | No invitation exists with the given slug |
| `500` | Database or server error |

**Example**

```bash
curl -s http://localhost:8080/api/v1/public/invitation/our-wedding-2026/rsvp
```

```json
{
  "status": "success",
  "data": [
    {
      "id": "b3a2f592-f44d-4a26-a02f-205441f7293a",
      "invitation_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "guest_name": "John Doe",
      "attendance_status": true,
      "total_pax": 2,
      "message": "So excited to celebrate with you!",
      "created_at": "2026-04-27T17:13:33.306503Z"
    }
  ],
  "message": ""
}
```

---

### POST `/api/v1/public/invitation/:slug/view`

Record a guest opening the invitation page and return the updated view count. The `views` counter lives on the Invitation record and is also included in the public `GET /api/v1/public/invitation/:slug` response.

> Guests should call this at most once per browser session per slug; repeated calls always increment the counter.

**Path Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `slug` | string | Yes | The invitation's unique slug |

**Request Headers**

| Header | Value |
|---|---|
| `Content-Type` | `application/json` |

No request body required.

**Response — 200 OK**

```json
{
  "status": "success",
  "data": { "views": 42 },
  "message": ""
}
```

**Status Codes**

| Code | Meaning |
|---|---|
| `200` | View recorded; new total returned |
| `404` | No invitation exists with the given slug |
| `500` | Database or server error |

**Example**

```bash
curl -s -X POST http://localhost:8080/api/v1/public/invitation/our-wedding-2026/view
```

```json
{
  "status": "success",
  "data": { "views": 43 },
  "message": ""
}
```
---

## Admin Endpoints

All admin endpoints require a valid JWT token:

```
Authorization: Bearer <token>
```

Requests missing or providing an invalid token receive `401 Unauthorized`.  
Requests targeting an invitation owned by another user receive `403 Forbidden`.

---

### POST `/api/v1/admin/invitation`

Create a new invitation.

**Request Headers**

| Header | Value |
|---|---|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <token>` |

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `slug` | string | **Yes** | URL-safe identifier, must be unique |
| `layout_id` | string | No | Frontend layout template identifier |
| `theme_config` | object (JSONB) | No | Free-form JSON theme configuration |
| `music_url` | string | No | Direct audio file URL |
| `couple` | object (JSONB) | No | Couple information |
| `events` | array (JSONB) | No | Event schedule |
| `stories` | array (JSONB) | No | Story/timeline entries |
| `gallery` | array (JSONB) | No | Photo gallery items |

**Response — 201 Created**

```json
{ "status": "success", "data": { /* Invitation object */ }, "message": "" }
```

**Status Codes**

| Code | Meaning |
|---|---|
| `201` | Invitation created successfully |
| `400` | Missing required `slug` or malformed JSON |
| `401` | Missing or invalid JWT token |
| `409` | Slug already in use by another invitation |
| `500` | Database or server error |

**Example**

```bash
curl -s -X POST http://localhost:8080/api/v1/admin/invitation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "slug": "smith-jones-2026",
    "layout_id": "layout-02",
    "music_url": "https://music.example.com/track.mp3",
    "couple": { "bride": "Emma", "groom": "Liam" }
  }'
```

```json
{
  "status": "success",
  "data": {
    "id": "b5e9b01b-cafe-46d3-a73a-4292aa6427e9",
    "slug": "smith-jones-2026",
    "layout_id": "layout-02",
    "theme_config": null,
    "music_url": "https://music.example.com/track.mp3",
    "couple": { "bride": "Emma", "groom": "Liam" },
    "events": null,
    "stories": null,
    "gallery": null,
    "created_at": "2026-04-28T16:15:14.170493Z",
    "updated_at": "2026-04-28T16:15:14.170493Z"
  },
  "message": ""
}
```

---

### GET `/api/v1/admin/invitations`

List all invitations, ordered by `created_at` descending.

**Request Headers**

| Header | Value |
|---|---|
| `Authorization` | `Bearer <token>` |

**Response — 200 OK**

```json
{ "status": "success", "data": [ /* array of Invitation objects */ ], "message": "" }
```

**Status Codes**

| Code | Meaning |
|---|---|
| `200` | Returns list (may be empty array) |
| `401` | Missing or invalid JWT token |
| `500` | Database or server error |

**Example**

```bash
curl -s http://localhost:8080/api/v1/admin/invitations \
  -H "Authorization: Bearer $TOKEN"
```

---

### GET `/api/v1/admin/invitation/:id`

Fetch a single invitation by its UUID.

**Path Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | The invitation's UUID |

**Request Headers**

| Header | Value |
|---|---|
| `Authorization` | `Bearer <token>` |

**Response — 200 OK**

```json
{ "status": "success", "data": { /* Invitation object */ }, "message": "" }
```

**Status Codes**

| Code | Meaning |
|---|---|
| `200` | Invitation found and returned |
| `400` | `id` is not a valid UUID |
| `401` | Missing or invalid JWT token |
| `404` | No invitation found with the given `id` |
| `500` | Database or server error |

**Example**

```bash
curl -s "http://localhost:8080/api/v1/admin/invitation/b5e9b01b-cafe-46d3-a73a-4292aa6427e9" \
  -H "Authorization: Bearer $TOKEN"
```

---

### PATCH `/api/v1/admin/invitation/:id`

Partially update an invitation. Only fields present in the request body are modified. All fields are optional.

**Path Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | The invitation's UUID |

**Request Headers**

| Header | Value |
|---|---|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <token>` |

**Request Body** — all fields optional

| Field | Type | Description |
|---|---|---|
| `slug` | string | New slug. Must be unique; returns `409` if already taken |
| `layout_id` | string | Frontend layout template identifier |
| `theme_config` | object (JSONB) | Free-form JSON theme configuration |
| `music_url` | string | Direct audio file URL |
| `couple` | object (JSONB) | Couple information |
| `events` | array (JSONB) | Event schedule |
| `stories` | array (JSONB) | Story/timeline entries |
| `gallery` | array (JSONB) | Photo gallery items |

**Response — 200 OK**

Returns the full updated `Invitation` object.

```json
{
  "status": "success",
  "data": { /* updated Invitation object */ },
  "message": ""
}
```

**Status Codes**

| Code | Meaning |
|---|---|
| `200` | Invitation updated; returns updated object |
| `400` | `id` path parameter is not a valid UUID, or request body is malformed JSON |
| `401` | Missing or invalid JWT token |
| `404` | No invitation found with the given `id` |
| `409` | The requested `slug` is already in use by another invitation |
| `500` | Database or server error |

**Example**

```bash
curl -s -X PATCH \
  "http://localhost:8080/api/v1/admin/invitation/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "slug": "our-wedding-2026",
    "theme_config": { "primaryColor": "#e8b4b8", "font": "Playfair Display" },
    "couple": { "bride": "Jane", "groom": "John" },
    "events": [{ "name": "Ceremony", "time": "10:00", "venue": "Garden Hall" }]
  }'
```

```json
{
  "status": "success",
  "data": {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "slug": "our-wedding-2026",
    "layout_id": "layout-01",
    "theme_config": { "primaryColor": "#e8b4b8", "font": "Playfair Display" },
    "music_url": "https://example.com/song.mp3",
    "couple": { "bride": "Jane", "groom": "John" },
    "events": [{ "name": "Ceremony", "time": "10:00", "venue": "Garden Hall" }],
    "stories": null,
    "gallery": null,
    "created_at": "2026-04-27T17:13:25.919981Z",
    "updated_at": "2026-04-27T17:13:38.456363Z"
  },
  "message": ""
}
```

---

### DELETE `/api/v1/admin/invitation/:id`

Permanently delete an invitation by its UUID.

**Path Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | The invitation's UUID |

**Request Headers**

| Header | Value |
|---|---|
| `Authorization` | `Bearer <token>` |

**Response — 200 OK**

```json
{ "status": "success", "data": { "deleted": true }, "message": "" }
```

**Status Codes**

| Code | Meaning |
|---|---|
| `200` | Invitation deleted successfully |
| `400` | `id` is not a valid UUID |
| `401` | Missing or invalid JWT token |
| `404` | No invitation found with the given `id` |
| `500` | Database or server error |

**Example**

```bash
curl -s -X DELETE \
  "http://localhost:8080/api/v1/admin/invitation/b5e9b01b-cafe-46d3-a73a-4292aa6427e9" \
  -H "Authorization: Bearer $TOKEN"
```

```json
{ "status": "success", "data": { "deleted": true }, "message": "" }
```

---

### GET `/api/v1/admin/invitation/:id/rsvp-list`

Fetch all RSVP submissions for a given invitation, ordered by `created_at` descending.

**Path Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | The invitation's UUID |

**Request Headers**

| Header | Value |
|---|---|
| `Authorization` | `Bearer <token>` |

**Response — 200 OK**

Returns an array of `RSVP` objects (empty array if no RSVPs yet).

```json
{
  "status": "success",
  "data": [ /* array of RSVP objects */ ],
  "message": ""
}
```

**Status Codes**

| Code | Meaning |
|---|---|
| `200` | Returns RSVP list (may be empty array) |
| `400` | `id` path parameter is not a valid UUID |
| `401` | Missing or invalid JWT token |
| `500` | Database or server error |

**Example**

```bash
curl -s \
  "http://localhost:8080/api/v1/admin/invitation/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11/rsvp-list" \
  -H "Authorization: Bearer $TOKEN"
```

```json
{
  "status": "success",
  "data": [
    {
      "id": "b3a2f592-f44d-4a26-a02f-205441f7293a",
      "invitation_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "guest_name": "John Doe",
      "attendance_status": true,
      "total_pax": 2,
      "message": "So excited to celebrate with you!",
      "created_at": "2026-04-27T17:13:33.306503Z"
    }
  ],
  "message": ""
}
```

---

### DELETE `/api/v1/admin/invitation/:id/rsvp/:rsvpId`

Delete a single guest RSVP belonging to an invitation the caller owns.

**Path Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | The invitation's UUID |
| `rsvpId` | string (UUID) | Yes | The RSVP's UUID |

**Request Headers**

| Header | Value |
|---|---|
| `Authorization` | `Bearer <token>` |

**Response — 200 OK**

```json
{ "status": "success", "data": { "deleted": true }, "message": "" }
```

**Status Codes**

| Code | Meaning |
|---|---|
| `200` | RSVP deleted successfully |
| `400` | `id` or `rsvpId` is not a valid UUID |
| `401` | Missing or invalid JWT token |
| `403` | The invitation belongs to another user |
| `404` | No such invitation, or no RSVP with that id under it |
| `500` | Database or server error |

**Example**

```bash
curl -s -X DELETE \
  "http://localhost:8080/api/v1/admin/invitation/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11/rsvp/b3a2f592-f44d-4a26-a02f-205441f7293a" \
  -H "Authorization: Bearer $TOKEN"
```

---

### POST `/api/v1/admin/upload/image`

Upload an image file to object storage (MinIO/S3) and receive a public URL.

**Request Headers**

| Header | Value |
|---|---|
| `Authorization` | `Bearer <token>` |
| `Content-Type` | `multipart/form-data` |

**Form Fields**

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | file | **Yes** | Image file. Allowed: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`. Max 5 MB. |

**Response — 200 OK**

```json
{
  "status": "success",
  "data": { "url": "http://localhost:9000/wedding-uploads/images/1777998700948-uuid.png" },
  "message": ""
}
```

**Status Codes**

| Code | Meaning |
|---|---|
| `200` | Upload successful; public URL returned |
| `400` | No file provided, or unsupported file type |
| `401` | Missing or invalid JWT token |
| `413` | File exceeds 5 MB limit |
| `500` | Storage error |

**Example**

```bash
curl -s -X POST http://localhost:8080/api/v1/admin/upload/image \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/photo.jpg"
```

```json
{
  "status": "success",
  "data": {
    "url": "http://localhost:9000/wedding-uploads/images/1777998700948-89692877-2386-4e4b-9eed-18e5efdf4a04.jpg"
  },
  "message": ""
}
```

> Use the returned `url` directly as a value in `gallery`, `couple`, or any other JSONB field of an invitation.

---

### DELETE `/api/v1/admin/invitation/:id/media`

Delete a media object (uploaded via `POST /api/v1/admin/upload/image`) from object storage.

**Request Headers**

| Header | Value |
|---|---|
| `Authorization` | `Bearer <token>` |
| `Content-Type` | `application/json` |

**Path Parameters**

| Param | Type | Description |
|---|---|---|
| `id` | UUID | Invitation ID. The authenticated user must own it. |

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | string | **Yes** | Public URL previously returned by the upload endpoint. Must start with the configured `S3_PUBLIC_URL`; anything else is rejected. |

**Response — 200 OK**

```json
{
  "status": "success",
  "data": { "deleted": true },
  "message": ""
}
```

**Status Codes**

| Code | Meaning |
|---|---|
| `200` | Object deleted from storage |
| `400` | Missing `url`, or URL outside the configured public base / invalid key |
| `401` | Missing or invalid JWT token |
| `403` | Authenticated user does not own the invitation |
| `404` | Invitation not found |
| `500` | Storage error |

**Example**

```bash
curl -s -X DELETE \
  "http://localhost:8080/api/v1/admin/invitation/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11/media" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "http://localhost:9000/wedding-uploads/images/1777998700948-89692877-2386-4e4b-9eed-18e5efdf4a04.jpg"}'
```

> Ownership is checked against the invitation only. Because the bucket is public-read and objects carry no per-owner record, any invitation owner who knows a media URL could delete that object even if it belongs to another user's invitation. Gallery items should be removed from the invitation `gallery` array via `PATCH /api/v1/admin/invitation/:id` in the same flow; storage deletion is secondary.

## Error Response Examples

**400 Bad Request** — missing required field:
```json
{
  "status": "error",
  "data": null,
  "message": "Key: 'GuestName' Error:Field validation for 'GuestName' failed on the 'required' tag"
}
```

**401 Unauthorized**:
```json
{ "status": "error", "data": null, "message": "unauthorized" }
```

**404 Not Found**:
```json
{ "status": "error", "data": null, "message": "invitation not found" }
```

**409 Conflict** — slug already taken:
```json
{ "status": "error", "data": null, "message": "slug already in use" }
```
