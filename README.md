
# School Equipment Lending Portal — SE ZG503 assignment

Hi — this repo contains our Phase 1 manual implementation for the School Equipment Lending Portal assignment.
It's a small full-stack demo (React frontend + Node/Express backend) that implements the core features required by the assignment.

What it does (short)
- Signup / login for users with roles: student, staff, admin.
- Admin can add/edit/delete equipment (name, category, condition, quantity).
- Students can request items; staff/admin can approve/reject and mark returns.
- Simple JWT token-based auth for demo purposes.

Quick setup (what we used locally)
1) Prereqs: Node.js (>=14), npm, MongoDB (Atlas or local).
2) Install dependencies:
	 - Backend:
		 cd server
		 npm install
	 - Frontend:
		 cd ../client
		 npm install
3) Run the app (two terminals):
	 - Backend:
		 cd server
		 npm run dev
	 - Frontend:
		 cd client
		 npm start

Auth notes (Phase 1)
- Login returns a JWT (signed token) valid for 1 hour containing { username, role }.
- The frontend stores the token in localStorage and sends it as `Authorization: Bearer <token>` on API requests.
-- The JWT secret is read from `JWT_SECRET` if set; otherwise a development secret is used. For grading/demo this is fine — do not commit a real secret.
-- Passwords are stored in plaintext in this demo to keep things simple for the assignment. If you want, we can add `bcrypt` hashing (recommended).

Important files
- client/: React app (entry `client/src/index.js`, auth UI `client/src/AuthPage.js`, views `client/src/StudentView.js`, `StaffView.js`, `AdminView.js`).
- server/: Express backend (`server/server.js`), logger (`server/logger.js`).

Minimal API examples
- Signup:
	POST /api/signup
	Body: { "username": "alice", "password": "pwd", "role": "student" }
- Login:
	POST /api/login
	Body: { "username": "alice", "password": "pwd" }
	Response: { "token": "<jwt>", "role": "student" }
- Verify token (example):
	GET /api/me
	Header: Authorization: Bearer <jwt>

Limitations / TODO (for Phase 1)
- Plaintext passwords (should use bcrypt for real apps).
- JWT secret currently defaults to a dev value — set `JWT_SECRET` for higher security.
- No automated tests included (we can add simple smoke tests if needed).

If you want us to expand this README with example curl commands, a Postman collection, or environment setup (`.env.example`), tell us which and we will add it.

Good luck — let's keep the code simple and clean for submission.


## Authentication (Phase 1)

This project uses a simple JWT-based token for Phase 1 (student assignment). Login returns a short-lived JWT (1 hour) with the user's `username` and `role` encoded. The frontend stores the token in `localStorage` and sends it on subsequent requests using the `Authorization: Bearer <token>` header.

Notes:
- The JWT secret is read from the `JWT_SECRET` environment variable, falling back to a development secret when not set. Change this before production.
- Passwords are stored in plaintext in the database in this demo. For production or improved security, replace with `bcrypt` hashing.
