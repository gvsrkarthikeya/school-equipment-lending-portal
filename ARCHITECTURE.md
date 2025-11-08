# School Equipment Lending Portal – Architecture & Technical Documentation (Phase 2 AI-Assisted)

## 1. Introduction
The School Equipment Lending Portal manages borrowing of shared school assets (lab devices, media kits, computing boards, etc.) by students and staff, with administrative oversight. Phase 1 delivered a manually built baseline (authentication, equipment CRUD, requests). Phase 2 refactors and enhances the system using AI assistance (GitHub Copilot) to add improved security, validation, standardized responses, usage analytics, and student borrowing analytics.

This document covers: requirements mapping, backend & frontend architecture, data model, flows, security, enhancement design, differences between phases, future extensibility, and alignment with the assignment rubric.

## 2. Objectives (Mapped to Assignment)
| Objective | Implementation |
|-----------|----------------|
| Authentication & Roles | JWT-based auth, `usersai` collection, roles: student, staff, admin |
| Equipment Management | CRUD endpoints with validation & invariant enforcement (available ≤ quantity) |
| Borrow & Return Requests | Request creation, approval, rejection, return; availability adjusted atomically |
| Dashboard & Search | React dashboard with search/filter by name/category, request actions, analytics panels |
| Prevent Overlaps | Duplicate pending request check per (user,equipment) pair; availability checks |
| Enhancement | Usage analytics (equipment borrow/return counters, lastBorrowedAt) + Student analytics (per-student borrow stats) |
| Documentation | OpenAPI spec (`server/openapi.json`), this Architecture doc, forthcoming AI usage log & reflection |

## 3. Technology Stack
### Backend
- Node.js + Express
- MongoDB (Atlas) via native driver
- Security & utilities: `helmet`, `cors`, `compression`, `morgan`, `bcryptjs`, `jsonwebtoken`, `express-validator`
- Logging: `winston` (wrapped in `logger.js`)

### Frontend
- React (Create React App structure)
- Axios for API communication
- React Router for navigation (Auth → Dashboard)

### Tooling & AI
- GitHub Copilot for code generation suggestions (validation patterns, error handling structure, OpenAPI skeleton)
- Manual curation of generated code (security hardening, collection separation)

## 4. Environment Configuration
`.env` (included for assignment convenience – normally excluded):
```
PORT=3001
NODE_ENV=development
MONGODB_URI=... (Atlas cluster)
DB_NAME=school-equipment-lending-portal
JWT_SECRET=dev-secret-change-me
JWT_EXPIRES_IN=1h
BCRYPT_ROUNDS=10
```
Assumption: Faculty will run locally with existing Atlas URI; no local Mongo requirement.

## 5. High-Level Architecture
Layered responsibilities:
1. HTTP Layer (Express routes) – defines endpoints & attaches validation rules.
2. Middleware Pipeline – security (helmet), CORS, logging (morgan), compression, JSON parsing.
3. Auth & Authorization – JWT verification + role gating.
4. Business Logic – request lifecycle updates availability + counters.
5. Data Access – direct MongoDB collection operations (no ORM/ODM for simplicity).
6. Analytics – aggregation pipelines on `requests` and direct projection for `equipments`.
7. Error Handling – centralized error handler emitting uniform `{ success:false, message }` responses.

## 6. Backend Design Details
### Middleware Order (in `server.js`)
1. `helmet()` – security headers
2. `cors()` – origin control (dev allows all)
3. `morgan()` – request logging
4. `compression()` – gzip responses
5. `express.json()` / `express.urlencoded()` – body parsing
6. Validation middlewares (per route via `express-validator`)
7. Auth (`authenticate`) & Authorization (`authorize`) – route-specific
8. Domain logic handlers
9. 404 fallback
10. Error handler (last)

### Collections
- `usersai`: `{ _id, username, password(hash), role, createdAt, updatedAt }`
- `equipments`: `{ _id, name, category, condition, quantity, available, borrowCount, returnCount, lastBorrowedAt, createdBy, createdAt, updatedAt, updatedBy? }`
- `requests`: `{ _id, equipmentId (string), user (username), status, createdAt, updatedAt, updatedBy? }`

### Indexes (created dynamically)
- `usersai`: `username` (unique)
- `equipments`: `name`, `category`, `available`
- `requests`: `user`, `equipmentId`, `status`

### Invariants
- `available <= quantity` enforced on equipment update.
- Equipment approval reduces `available` atomically only if > 0.
- Return increments `available`.
- Duplicate pending request for same user/equipment rejected (409).

### Response Shape
Uniform pattern: `{ success: boolean, data?, message?, count? }` to facilitate consistent client handling.

## 7. Authentication & RBAC Flow
Sequence (login scenario):
1. User submits credentials → `/api/login`.
2. Server validates inputs; finds user; bcrypt compare.
3. Issues JWT with `sub`, `username`, `role`.
4. Client stores token in `localStorage`; sets `Authorization: Bearer <token>` on axios.
5. Protected routes call `authenticate` → decode token, attach `req.user`.
6. Authorization wrapper checks `req.user.role` against allowed roles.

Roles & Access:
| Endpoint | Student | Staff | Admin |
|----------|---------|-------|-------|
| POST /api/signup | Yes | Yes | Yes |
| POST /api/login | Yes | Yes | Yes |
| GET /api/equipment | Yes | Yes | Yes |
| POST /api/equipment | No | No | Yes |
| PUT/DELETE /api/equipment/:id | No | No | Yes |
| GET /api/requests | Own only | All | All |
| POST /api/requests | Yes | Yes (if needed) | Yes |
| PUT /api/requests/:id | No | Yes | Yes |
| GET /api/analytics/* | No | Yes | Yes |

## 8. Request Lifecycle
States: `pending → approved → returned` or `pending → rejected`.
Transitions:
- `pending → approved`: decrement equipment `available`; increment `borrowCount`; set `lastBorrowedAt`.
- `approved → returned`: increment `available`; increment `returnCount`.
- `pending → rejected`: no inventory change.
Constraints:
- Approval only if `available > 0`.
- Return only valid for previously approved requests.

## 9. Enhancement: Usage & Student Analytics
### Equipment Analytics (`GET /api/analytics/equipment`)
- Projection of usage fields sorted by `borrowCount`.
- Purpose: Identify high-demand items.

### Student Analytics (`GET /api/analytics/students`)
- Aggregation pipeline groups requests by `(user,equipmentId)` counting approved/returned occurrences.
- `timesBorrowed` counts historical borrow events.
- `currentlyBorrowed` counts active approved (not returned) requests.
- Fallback for missing usernames: `(unknown)`.

Benefit: Enables administrative insight into borrower behavior and inventory rotation (fulfills enhancement requirement in rubric for 3–4 member group).

## 10. Validation Strategy
Using `express-validator` per route:
- Signup: username pattern, length, role enum.
- Login: presence of credentials.
- Equipment create: required fields + quantity int >=1.
- Request create/update: valid Mongo object IDs and status enum.
Errors aggregated and returned: `400 Validation failed` with error array.

## 11. Error Handling
Central handler captures thrown or passed errors:
- MongoServerError → `500 Database error`
- Auth failures → `401` / `403`
- Not found → `404` specific route responses
- Generic fallback → `500 Internal server error`
All serialized with consistent JSON format.

## 12. Frontend Architecture
### Component Structure
- `AuthPage` – Login/Signup forms, role selection on signup.
- `RoleBasedDashboard` – Main hub; loads equipment, requests, dynamic role from `/api/me`.
- Conditional sections: Equipment table, Assigned Equipment panel (students), Request management (staff/admin), Analytics tables (staff/admin).

### State Management
- Local React `useState` + `useEffect` for fetching initial data.
- Derived data: filtered equipment (search/category), analytics triggered on demand.
- Token persistence: `localStorage`; axios default header set after login.

### UX Enhancements
- Disabled request button when already pending/approved or availability=0.
- Edit inline row handling for equipment updates (admin).
- Confirmation modal for delete.
- Loading skeleton while initial data fetch occurs.

## 13. Integration Points
Example flows:
1. Student borrows equipment → Request POST → Admin approves → Availability decremented → Dashboard updates.
2. Return processed → Equipment availability & returnCounter updated → Student analytics reflect active vs historical.
3. Analytics fetch triggered manually → Aggregation results displayed without page reload.

Sequence (Approve flow textual diagram):
```
[Student] -> POST /api/requests (pending)
[Admin/Staff] -> PUT /api/requests/:id status=approved
Backend: available--, borrowCount++, lastBorrowedAt=now
[Admin/Staff] -> PUT /api/requests/:id status=returned
Backend: available++, returnCount++
```

## 14. Phase 1 vs Phase 2 Comparison
| Aspect | Phase 1 | Phase 2 |
|--------|---------|---------|
| Auth | Basic / insecure passwords | Bcrypt hashing + JWT |
| Users | Single collection | Split (`usersai`) to avoid plaintext confusion |
| Validation | Minimal | Full express-validator rules |
| Error Handling | Ad-hoc | Centralized uniform responses |
| Invariants | Not enforced | `available <= quantity` enforced |
| Duplicate Requests | Possible | Prevented (409) |
| Enhancement | None | Usage + Student analytics |
| Response Format | Inconsistent shapes | Standard `{ success, data, message }` |
| Role Persistence | Fragile (URL state) | Derived from `/api/me` token payload |
| Documentation | Sparse | OpenAPI + this Architecture doc |

## 15. Testing Strategy (Planned)
Backend (Jest):
- Signup & login (success + invalid credentials)
- Equipment create (admin) + list count
- Request lifecycle (pending → approved → returned) verifies inventory adjustments
- Duplicate pending request returns 409
- Unauthorized access test (student attempting admin operation)

Frontend (React Testing Library):
- AuthPage toggles login/signup and persists token
- Dashboard renders role-based sections (mock `/api/me`)
- Request button disabled when conditions met

## 16. Assumptions & Constraints
- Data volume moderate: Simple indexes sufficient.
- No pagination required for assignment scale.
- No email/password reset flows.
- Analytics real-time when fetched (no caching layer).
- Atlas connection stable during evaluation.

## 17. Security Considerations
- JWT expiry (`1h`) reduces long-term token risk.
- Bcrypt hashing for passwords (`10` rounds) balanced for assignment performance.
- Helmet sets protective headers; CORS all-origins in dev (should be locked in production).
- Rate limiting omitted for dev to avoid interference (could reintroduce in production).

## 18. Extensibility
Potential future additions:
- Due date / overdue automation: Add `dueDate`, periodic cron to mark overdue and notify.
- Damage/Repair log: New collection `equipment_events` referencing equipmentId with event types.
- Fine/penalty tracking for late returns.
- Pagination & caching for large equipment lists.
- Role onboarding workflow (auto-assign default roles via invitations).

## 19. Enhancement Design Justification
Choosing usage analytics over due dates/damage logs:
- Lower implementation risk, immediate administrative value.
- Demonstrates aggregation skills and augmentation of schema with counters.
- Student analytics adds a second dimension (borrower behavior) maximizing enhancement mark.

## 20. AI Assistance Summary (Detailed log will be in AI_USAGE_LOG.md)
AI helped with:
- Structuring validation arrays.
- Drafting OpenAPI schema sections.
- Suggesting middleware ordering & error handler pattern.
Manual refinement ensured:
- Correct invariant logic.
- Avoiding overbroad error messages.
- Accurate aggregation pipeline for student analytics.

## 21. Rubric Coverage Checklist
| Rubric Item | Covered In |
|-------------|------------|
| Backend APIs | Endpoints + validation + OpenAPI (Sections 6–7) |
| Frontend UI | Dashboard features (Section 12) |
| Integration | Flows & sequence examples (Section 13) |
| Enhancement | Usage & Student analytics (Sections 9 & 19) |
| AI Usage Log | Planned separate file (Section 20) |
| Reflection | Pending (will reference Phase diff Section 14) |
| Code Quality | Invariants, standardized responses, documentation |

## 22. Setup Instructions (Summary)
Backend:
```
cd server
node server.js
```
Frontend:
```
cd client
npm start
```
Login flow: Signup → Login → Dashboard (role determined via `/api/me`).

## 23. Known Limitations
- No automated cleanup for orphaned requests if equipment removed.
- `equipmentId` in requests stored as string; aggregation uses `$toObjectId` (assumes valid values).
- No integration tests yet – manual flows validated.

## 24. Future Improvements For Production Readiness
- Replace plain strings with enums central config.
- Add structured logging correlation IDs.
- Introduce service layer abstraction (currently route-level logic).
- Add pagination & sorting parameters for analytics endpoints.

---
**End of Architecture Document (Phase 2)**
