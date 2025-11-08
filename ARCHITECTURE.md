# Architecture Overview (Manual Development – Main Branch)

This document explains the simple structure of the manual implementation for the School Equipment Lending Portal. It is intentionally minimal and focuses on clarity for an assignment rather than production hardening.

## 1. Goals
Provide a basic portal where users can:
- Sign up and log in
- View, add, edit, and delete equipment
- Create and manage borrow requests

## 2. Stack
- Backend: Node.js + Express + MongoDB (native driver)
- Frontend: React (Create React App structure) + Axios
- Auth: JSON Web Tokens (JWT) issued at login (no refresh tokens)
- Logging: Winston (simple console + file logging)

## 3. Data Model (Collections)
- users: { _id, username, password, role, createdAt }
- equipments: { _id, name, category, condition, quantity, available }
- requests: { _id, equipmentId, user, status }

Notes:
- Password is currently plaintext (improvement would be hashing with bcrypt).
- `available` is manually managed when approving/returning requests.

## 4. Backend Flow
Signup:
1. Client posts credentials & role
2. Server checks username uniqueness
3. Inserts user document

Login:
1. Client posts username/password
2. Server finds matching user (plaintext compare)
3. Issues JWT (1 hour expiry) with user id, username, role

Equipment CRUD:
- All routes open; no role checks in this manual version.
- Update fully replaces provided fields; no invariant checks.

Requests:
- Create: client supplies equipmentId, user, status
- Update: adjusts equipment availability when moving to approved or returned
- List: returns all requests for everyone

## 5. Frontend Overview
Components:
- AuthPage: toggles between signup and login
- RoleBasedDashboard: lists equipment, filter/search, handle borrow requests, simple analytics section (counts)

State Handling:
- Fetches equipment & requests on mount
- Stores token in localStorage for manual usage
- Uses location.state for role display

## 6. Request Status Logic (Manual)
Statuses: pending, approved, rejected, returned
- Approve: decrements equipment.available by 1 (if available > 0)
- Return: increments equipment.available by 1
- Reject: no availability change

## 7. Known Limitations
- No server-side role based access (RBAC)
- Plaintext passwords
- Missing input validation (could add express-validator)
- Requests not scoped per user
- Possible duplicate pending requests for same equipment/user
- No standardized JSON response envelope (mixed styles)

## 8. Improvement Ideas (If Extended)
- Add bcrypt hashing and validation middleware
- Enforce `available <= quantity` on updates
- Scope GET /api/requests by user role
- Prevent duplicate pending requests
- Add consistent `{ success, data, message }` responses
- Introduce indexes (username, equipmentId, status)

## 9. Simple Sequence Example
Borrow Flow:
1. Student clicks Request → POST /api/requests (status=pending)
2. Admin approves → PUT /api/requests/:id (status=approved) → equipment.available--
3. Admin marks returned → PUT /api/requests/:id (status=returned) → equipment.available++

## 10. Why Separate Manual vs AI-Assisted
This manual branch shows the core logic without advanced security or analytics. The AI-assisted branch layers on validation, usage statistics, and documentation. Keeping them separate clarifies incremental learning and improvement steps.

---
End of manual architecture document.
