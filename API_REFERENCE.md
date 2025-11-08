# School Equipment Lending Portal – Simplified API Reference (Phase 2)

This human-friendly reference sits alongside the formal `openapi.json` (OpenAPI 3.0.3). Use this file for quick understanding; consult the spec for exhaustive schema details.

## Base URL

Local development backend: `http://localhost:3001`

All JSON responses share a unified envelope:

```json
{
  "success": true,
  "data": {},            // payload (object | array | primitive)
  "message": "optional", // human-readable message (failures / info)
  "count": 0              // included on list endpoints
}
```

On errors: `success: false` plus `message` (and optional `errors` array for validation).

## Authentication

JWT Bearer tokens. Provide in header:

`Authorization: Bearer <token>`

Roles: `student`, `staff`, `admin`.

| Area | Student | Staff | Admin |
|------|---------|-------|-------|
| Signup | Public | Public | Public |
| Login | Public | Public | Public |
| View own requests | ✅ | ✅ (all) | ✅ (all) |
| Create request | ✅ | (Not typical) | (Not typical) |
| Approve / Reject / Return | ❌ | ✅ | ✅ |
| Create / Update / Delete equipment | ❌ | ❌ | ✅ |
| Equipment analytics | ❌ | ✅ | ✅ |
| Student analytics | ❌ | ✅ | ✅ |

## System Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/health` | Health + uptime | None |
| GET | `/api` | API info banner | None |

## Auth Endpoints

### POST `/api/signup`
Create a user.

Body:
```json
{ "username": "alice", "password": "Secret123", "role": "student" }
```
Success (201):
```json
{ "success": true, "userId": "<mongoId>" }
```
Errors: 409 username exists; 400 validation.

### POST `/api/login`
Body:
```json
{ "username": "alice", "password": "Secret123" }
```
Success:
```json
{
  "success": true,
  "token": "<jwt>",
  "role": "student",
  "user": { "id": "<id>", "username": "alice", "role": "student" }
}
```
Errors: 401 invalid credentials; 400 validation.

### GET `/api/me`
Returns current user derived from token.
```json
{ "success": true, "user": { "id": "<id>", "username": "alice", "role": "student" } }
```

## Equipment Endpoints

### GET `/api/equipment`
Optional query params: `category`, `available` (min available), `search` (regex on name/category).
Success example:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "<id>", "name": "Raspberry Pi Kit", "category": "Microcontroller",
      "condition": "good", "quantity": 10, "available": 8,
      "borrowCount": 5, "returnCount": 5, "lastBorrowedAt": "2025-11-08T10:22:00Z"
    }
  ]
}
```

### POST `/api/equipment` (admin only)
Body:
```json
{ "name": "Digital Multimeter", "category": "Electronics", "condition": "new", "quantity": 5 }
```
`available` defaults to `quantity` if omitted. Counters start at 0.

### PUT `/api/equipment/:id` (admin only)
Update fields: `name`, `category`, `condition`, `quantity`, `available`.
Invariant enforced: `available <= quantity` (if quantity reduced, available capped).

### DELETE `/api/equipment/:id` (admin only)
Removes equipment if found.

## Request (Borrow) Endpoints

### GET `/api/requests`
Students: only their requests. Staff/Admin: all.

### POST `/api/requests` (student)
Body:
```json
{ "equipmentId": "<equipmentId>", "user": "alice", "status": "pending" }
```
Rules:
- Must have `available > 0` for pending.
- Rejects duplicate pending request for same (user, equipment) with 409.

### PUT `/api/requests/:id` (staff/admin)
Transitions status among `pending → approved → returned` (or `rejected`).
Effects:
- Approve: decrements equipment `available -1`, increments `borrowCount`, sets `lastBorrowedAt`.
- Return: increments equipment `available +1`, increments `returnCount`.
- Reject: no inventory change.

## Analytics Endpoints

### GET `/api/analytics/equipment` (staff/admin)
Returns usage counters per equipment sorted by `borrowCount` desc.

### GET `/api/analytics/students` (staff/admin)
Per student + equipment aggregation:
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "user": "alice",
      "equipmentId": "<id>",
      "equipmentName": "Raspberry Pi Kit",
      "category": "Microcontroller",
      "timesBorrowed": 3,
      "currentlyBorrowed": 1
    }
  ],
  "summary": {
    "alice": { "totalBorrowed": 3, "activeBorrowed": 1 }
  }
}
```
Missing usernames appear as `"(unknown)"`.

## Error Examples

Validation failure (e.g. short password):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [ { "msg": "Invalid value", "param": "password", "location": "body" } ]
}
```

Not found:
```json
{ "success": false, "message": "Not found" }
```

Unauthorized / Forbidden:
```json
{ "success": false, "message": "Unauthorized" }
{ "success": false, "message": "Forbidden" }
```

Duplicate request:
```json
{ "success": false, "message": "Request already pending for this equipment" }
```

## Common Curl Examples (Optional)

Login:
```bash
curl -X POST http://localhost:3001/api/login -H "Content-Type: application/json" -d '{"username":"alice","password":"Secret123"}'
```

List equipment:
```bash
curl http://localhost:3001/api/equipment
```

Create request:
```bash
curl -X POST http://localhost:3001/api/requests \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"equipmentId":"<id>","user":"alice","status":"pending"}'
```

Approve request:
```bash
curl -X PUT http://localhost:3001/api/requests/<requestId> \
  -H "Authorization: Bearer <staffOrAdminToken>" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved"}'
```

## When to Use Which File

| File | Purpose |
|------|---------|
| `openapi.json` | Machine-readable spec (import into Swagger UI / Postman). |
| `API_REFERENCE.md` | Quick human overview for evaluators & teammates. |
| `ARCHITECTURE.md` | Deep design, flows, invariants, phase comparison. |

## Extensibility Notes

Add features (e.g. due dates) by augmenting request schema and adjusting lifecycle logic; reflect in `openapi.json` then update this reference.

---
Maintained in Phase 2. Update both this file and the OpenAPI spec when endpoints change.
