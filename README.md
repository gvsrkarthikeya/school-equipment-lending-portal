# School Equipment Lending Portal (Manual Development – Main Branch)

This is the simple, manually developed version used for the assignment. It focuses on core features and is easy to run and grade. Security hardening and analytics are not included here (they are part of a separate AI-assisted branch).

## Quick Start
Backend (API):
```bash
cd server
node server.js
```
Frontend (React):
```bash
cd client
npm install
npm start
```

## What’s Implemented
- Signup and login (returns JWT)
- Equipment list/add/edit/delete
- Borrow requests (create, approve/reject, return)

## Important Notes
- Responses are plain JSON (no envelope)
- No server-side role checks on routes in this manual version
- Passwords are stored as plaintext in DB (kept simple for assignment)

## Documentation
- ARCHITECTURE.md – how the manual version is structured
- API_REFERENCE.md – endpoints and examples
- SETUP_INSTRUCTIONS.md – how to run locally

---
This README is intentionally short and practical for grading.

# School Equipment Lending Portal (Manual Development – Main Branch)

This branch contains the manual development version (baseline) of the portal. It focuses on core features with minimal dependencies and intentionally lacks several production-grade safeguards that are implemented in the AI-assisted branch.

## Quick Start
1. Server
	- Edit `server/server.js` if needed and ensure MongoDB URI is valid.
	- Start API:
```bash
cd server
node server.js
```
	- API runs at `http://localhost:3001`.
2. Client
```bash
cd ../client
npm install
npm start
```

## Current Features (Manual)
- JWT issued on login (used by client), minimal middleware
- Equipment CRUD (no server-side RBAC yet)
- Requests: create, list, update status (approve/reject/return)
- Basic dashboard with search/filter and inline edit

## Known Limitations (Manual)
- Passwords are stored/compared in plaintext (needs bcrypt)
- MongoDB URI is embedded in code (move to `.env`)
- No server-side role enforcement (RBAC) on routes
- No input validation for equipment/requests
- No invariant enforcement on `available <= quantity`
- Students can list all requests; server does not scope by user
- Duplicate pending requests not blocked
- Inconsistent API response shapes

See `MANUAL_GAP_ANALYSIS.md` for a prioritized list of fixes.

## Branches
- `main`: manual development (this branch)
- `phase2-ai-assisted`: AI-assisted implementation with hardened security, validation, analytics, and full docs

## Minimal Endpoint Guide (Manual)
- `POST /api/signup` – creates user (plaintext password)
- `POST /api/login` – returns `{ token, role, user }`
- `GET /api/equipment` – list equipment
- `POST /api/equipment` – add equipment
- `PUT /api/equipment/:id` – update equipment
- `DELETE /api/equipment/:id` – delete equipment
- `GET /api/requests` – list all requests (no scoping)
- `POST /api/requests` – create request (takes `user` from client body)
- `PUT /api/requests/:id` – update request status

## Next Steps (Manual)
Follow the order in `MANUAL_GAP_ANALYSIS.md` to bring the manual branch to a secure baseline while keeping it separate from the AI-assisted branch.
