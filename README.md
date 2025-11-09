
# School Equipment Lending Portal (Phase 2 – AI Assisted)

## 📝 Overview
This repository contains the Phase 2 (AI-assisted) version of the School Equipment Lending Portal. It features:
- **Backend:** Node.js/Express + MongoDB
- **Frontend:** React
- **Documentation:** API, architecture, and AI enhancement summaries
- **Enhancements:** Usage & student analytics

---

## 🚀 Quick Start

```bash
# In the root directory
npm install

cd server
npm install
node server.js   # API at http://localhost:3001

cd ../client
npm install
npm start        # React dev server (API base: see REACT_APP_API_URL)
```

---

## 📚 Key Documentation

| File                    | Purpose                                                        |
|-------------------------|----------------------------------------------------------------|
| `openapi.json`          | Machine-readable API spec (Swagger/Postman import)              |
| `API_REFERENCE.md`      | Human-friendly endpoint summary & examples                      |
| `ARCHITECTURE.md`       | Design, flows, invariants, phase comparison                     |
| `AI_ENHANCEMENTS_SUMMARY.md` | AI-assisted improvements (security, performance, etc.)     |
| `SETUP_INSTRUCTIONS.md` | Basic server setup & curl test examples                         |

> The server folder contains stub files pointing back here for compatibility.

---

## 📊 Enhancement Implemented (Phase 2)

**Usage & Student Analytics:**
- Equipment counters: `borrowCount`, `returnCount`, `lastBorrowedAt`
- Endpoints: `/api/analytics/equipment`, `/api/analytics/students`
- Dashboard: Staff/admin see aggregated usage & per-student borrowing stats
- **Analytics Visualization:** Dashboard analytics are visualized using [Chart.js](https://www.chartjs.org/) (via `react-chartjs-2`).

---

## 🌟 Core Features

- JWT auth with role-based access (student, staff, admin)
- Secure password hashing (bcrypt)
- Equipment CRUD (admin)
- Borrow request lifecycle (student request; staff/admin approve/reject/return)
- Duplicate pending request prevention
- Inventory invariant: `available <= quantity` enforced
- Consistent JSON response envelope

---

## 🛠️ Next Planned Items

Pending (see internal TODO):
- Automated tests
- Environment variable for client API base (`REACT_APP_API_URL`)
- AI usage log
- Reflection report
- Demo script
- Version tagging

---

## 🔄 Phase Comparison

| Aspect     | Phase 1         | Phase 2                                         |
|------------|-----------------|------------------------------------------------|
| Auth       | Basic JWT       | JWT + bcrypt hashing + role middleware          |
| Validation | Minimal         | Comprehensive express-validator                 |
| Security   | Limited         | helmet, hashing, planned rate limits           |
| Analytics  | None            | Equipment & Student usage analytics            |
| Docs       | Sparse          | OpenAPI + architecture + summaries             |

---

## 📄 License

Academic/assignment use only.
