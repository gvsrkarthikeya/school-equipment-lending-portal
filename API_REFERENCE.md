# API Reference (Manual Development – Main Branch)

This is a simple, assignment-friendly API guide for the manual implementation. It documents the endpoints as they behave right now. Most responses are plain JSON without a wrapper.

Base URL: http://localhost:3001

Notes
- Authentication: A JWT is issued on login, and /api/me uses the token. Other endpoints do not enforce auth in this manual version.
- Roles: The user has a role field (student/staff/admin), but server-side role checks are not applied to endpoints here.

## Auth

POST /api/signup
- Body: { "username": string, "password": string, "role": "student" | "staff" | "admin" }
- Success: { "message": "success" }
- Conflict: { "message": "Username already exists!" }

POST /api/login
- Body: { "username": string, "password": string }
- Success:
  {
    "token": "<jwt>",
    "role": "student",
    "user": { "id": "<id>", "username": "alice", "role": "student" }
  }
- Failure: { "message": "Invalid credentials!" }

GET /api/me
- Headers: Authorization: Bearer <token>
- Success: { "id": "<id>", "username": "alice", "role": "student" }

## Equipment

GET /api/equipment
- Returns: [ { _id, name, category, condition, quantity, available } ]

POST /api/equipment
- Body: { name, category, condition, quantity, available }
- Returns: inserted document with _id

PUT /api/equipment/:id
- Body: { name, category, condition, quantity, available }
- Returns: { "message": "Equipment updated" }

DELETE /api/equipment/:id
- Returns: { "message": "Equipment deleted" } or 404 if not found

## Requests

GET /api/requests
- Returns: [ { _id, equipmentId, user, status } ]
- Note: Not scoped by user in this manual version.

POST /api/requests
- Body: { equipmentId: string, user: string, status: "pending" | "approved" | "rejected" | "returned" }
- Returns: inserted document with _id

PUT /api/requests/:id
- Body: { status: "pending" | "approved" | "rejected" | "returned" }
- Effects:
  - If moving to approved: decrements equipment.available by 1 if available > 0, otherwise 400 { message: "No availability for this equipment" }
  - If moving from approved to returned: increments equipment.available by 1
- Returns: { "message": "Request updated" }

## Data Shapes

Equipment
{
  "_id": "<id>",
  "name": "Camera",
  "category": "Media",
  "condition": "Good",
  "quantity": 2,
  "available": 1
}

Request
{
  "_id": "<id>",
  "equipmentId": "<equipmentId>",
  "user": "alice",
  "status": "pending" | "approved" | "rejected" | "returned"
}

User (login response)
{
  "id": "<id>",
  "username": "alice",
  "role": "student"
}

## Known Gaps (Manual Version)
- No server-side role checks on equipment/request endpoints
- Plaintext passwords in DB
- No validation on inputs
- Requests list not scoped by user
