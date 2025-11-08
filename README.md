# School Equipment Lending Portal (Phase 2 – AI Assisted)

## Overview
This repository contains the Phase 2 (AI-assisted) version of the School Equipment Lending Portal. It includes backend (Node.js/Express + MongoDB) and frontend (React) plus documentation and enhancement features (usage & student analytics).

## Quick Start
```bash
cd server
node server.js   # starts API on http://localhost:3001

cd ../client
npm install
npm start        # starts React dev server (adjust API base via REACT_APP_API_URL later)
```

## Key Documentation (Root Level)
| File | Purpose |
|------|---------|
| `openapi.json` | Formal machine-readable API specification (import into Swagger/Postman). |
| `API_REFERENCE.md` | Human-friendly summary of endpoints & examples. |
| `ARCHITECTURE.md` | Deep dive: design decisions, flows, invariants, phase comparison. |
| `AI_ENHANCEMENTS_SUMMARY.md` | Catalog of AI-assisted improvements (security, performance, etc.). |
| `SETUP_INSTRUCTIONS.md` | Basic server setup and curl test examples. |

Server folder still contains stub files pointing back here for backward compatibility.

## Enhancement Implemented (Phase 2 Requirement)
Usage & Student Analytics:
* Equipment counters: `borrowCount`, `returnCount`, `lastBorrowedAt`
* Endpoints: `/api/analytics/equipment`, `/api/analytics/students`
* Dashboard sections for staff/admin displaying aggregated usage and per-student borrowing stats.

## Core Features
* JWT auth with role-based access (student, staff, admin)
* Secure password hashing (bcrypt)
* Equipment CRUD (admin)
* Borrow request lifecycle (student request; staff/admin approve/reject/return)
* Duplicate pending request prevention
* Inventory invariant `available <= quantity` enforced on updates
* Consistent JSON response envelope

## Next Planned Items
Pending tasks (see TODO tracking internally): automated tests, environment variable for client API base (`REACT_APP_API_URL`), AI usage log, reflection report, demo script, version tagging.

## Phase Comparison (Quick)
| Aspect | Phase 1 | Phase 2 |
|--------|---------|---------|
| Auth | Basic JWT | JWT + bcrypt hashing + role middleware |
| Validation | Minimal | Comprehensive express-validator |
| Security | Limited | helmet, hashing, planned rate limits |
| Analytics | None | Equipment & Student usage analytics |
| Docs | Sparse | OpenAPI + architecture + summaries |

## License
Academic/assignment use only.
