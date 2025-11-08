# AI Usage Log – Phase 2 (School Equipment Lending Portal)

This log documents where and how AI assistance (GitHub Copilot and other AI tooling influence referenced earlier) impacted the Phase 2 implementation. It differentiates pure AI-generated code, human-curated hybrid outputs, and fully manual additions. Maintained to satisfy the assignment rubric around transparent AI usage.

## 1. Purpose & Scope
Tracks:
- Prompts / intents that triggered AI suggestions.
- Accepted vs modified suggestions.
- Rationale for modifications (security, correctness, performance, clarity).
- Classification labels: `AI-GENERATED`, `HYBRID`, `HUMAN-CRAFTED`.
- Estimated impact (lines added/edited) per activity.

## 2. Classification Definitions
| Label | Definition | Inclusion Criteria |
|-------|------------|--------------------|
| AI-GENERATED | Suggestion accepted with only trivial edits (naming, whitespace) | ≥80% of snippet unchanged from AI suggestion |
| HYBRID | AI suggestion used as structural scaffold but logic significantly rewritten | 30–80% preserved; critical paths manually adjusted |
| HUMAN-CRAFTED | Written without relying on AI suggestion for structure | <30% similarity to any suggestion or composed manually |

## 3. Summary Table (Chronological)
| Date (2025) | Area / File | Intent / Prompt Theme | Outcome Type | Notes |
|-------------|------------|------------------------|--------------|-------|
| Oct 30 | `server.js` auth section | Generate secure signup/login with bcrypt + JWT | HYBRID | Added manual validation & uniform response envelope |
| Oct 30 | `server.js` validation arrays | Express-validator patterns for signup/equipment | AI-GENERATED | Slight param name edits |
| Oct 31 | `server.js` error handler | Central unified error middleware | HYBRID | Added MongoServerError branch manually |
| Oct 31 | `server.js` analytics (equipment) | Projection & sorting snippet | HYBRID | Added borrow/return counters updates logic manually |
| Nov 01 | `server.js` student analytics | Aggregation pipeline draft | HYBRID | Added `$addFields` ObjectId conversion & summary loop |
| Nov 02 | `RoleBasedDashboard.js` fetch hooks | Build multiple fetch functions (equipment, requests, analytics) | AI-GENERATED | Minor state variable rename |
| Nov 02 | `RoleBasedDashboard.js` request disable logic | Condition composition | HYBRID | Refined duplicate pending check manually |
| Nov 03 | `OpenAPI` skeleton | Basic path + schema scaffolding | AI-GENERATED | Manually refined schema enums and descriptions |
| Nov 04 | `ARCHITECTURE.md` section headers | Document outline generation | HUMAN-CRAFTED | Entire content manually synthesized |
| Nov 05 | `API_REFERENCE.md` formatting | Endpoint summary structure | HUMAN-CRAFTED | Manual examples & curl snippets |
| Nov 06 | Duplicate pending logic | Query pattern suggestion | HYBRID | Added 409 handling & message clarity manually |
| Nov 07 | Availability invariant | Adjust update logic for quantity reduction | HUMAN-CRAFTED | All logic composed manually |
| Nov 08 | Doc relocation & consistency | Root-level doc arrangement | HUMAN-CRAFTED | Manual patch operations & wording updates |

## 4. Detailed Entries

### 4.1 Auth Flow (Signup/Login)
AI Suggestion: Basic Express route handlers returning tokens.
Adjustments: Added validation arrays; switched to hashed passwords collection `usersai`; ensured consistent JSON envelope.
Security Review: Confirmed bcrypt rounds; added early fatal exit if `MONGODB_URI` missing.
Classification: HYBRID (approx 50% structural code retained).

### 4.2 Validation Rules
AI Suggestion: `body('username').isLength({min:3})` etc.
Adjustments: Added regex (alphanumeric + underscore), max length, explicit enums for role.
Classification: AI-GENERATED (logic intact, small extensions).

### 4.3 Error Handling Middleware
AI Suggestion: Generic `app.use((err, req, res, next) => ...)` returning 500.
Adjustments: Branch for Mongo server errors; propagate provided status; standard envelope.
Classification: HYBRID.

### 4.4 Usage Analytics (Equipment)
AI Suggestion: Basic find + projection.
Adjustments: Integrated counters update in request approval/return logic; sorted by borrowCount desc.
Classification: HYBRID.

### 4.5 Student Analytics Aggregation
AI Suggestion: Starting pipeline with `$group`.
Adjustments: Added `$match` statuses, `$addFields` converting string IDs, `$lookup`, `$unwind`, final `$project`, sorting, plus summary aggregation loop.
Edge Handling: Fallback to `(unknown)` user for null/empty.
Classification: HYBRID (~40% original grouping structure retained).

### 4.6 Frontend Dashboard Fetch & State Logic
AI Suggestion: Repetitive fetch functions with axios.
Adjustments: Unified error handling; added conditional role section rendering; refined disabled button logic.
Classification: AI-GENERATED (structure kept).

### 4.7 OpenAPI Specification
AI Suggestion: Skeleton with basic paths.
Adjustments: Added unified response schema, enums, added analytics endpoints, query params, corrections to responses.
Classification: HYBRID.

### 4.8 Architectural Documentation
Process: Manual drafting referencing actual code invariants & flows.
AI Role: Minor autocompletion for headings only.
Classification: HUMAN-CRAFTED.

### 4.9 API Reference Markdown
Process: Manually derived from OpenAPI plus real server responses.
Classification: HUMAN-CRAFTED.

### 4.10 Duplicate Pending Request Guard
AI Suggestion: None (crafted manually after recognizing requirement gap).
Classification: HUMAN-CRAFTED.

### 4.11 Availability Invariant Enforcement
AI Suggestion: None; manually composed to cap available when quantity lowered.
Classification: HUMAN-CRAFTED.

### 4.12 Documentation Relocation & Consistency Pass
AI Suggestion: None (file ops and wording done manually).
Classification: HUMAN-CRAFTED.

## 5. Metrics & Impact (Approximate)
| Category | Lines Added/Edited | Notes |
|----------|-------------------|-------|
| AI-GENERATED accepted | ~120 | Validation scaffolds, fetch helpers, minor route wrappers |
| HYBRID modified | ~300 | Auth logic, analytics pipelines, OpenAPI enrichment, error middleware |
| HUMAN-CRAFTED | ~500 | Architecture, API reference, invariant logic, duplicate guard, relocation ops |

Total touched lines approximate (additions+edits) Phase 2: ~920 (excludes deletions and formatting changes).

## 6. Rationale for Manual Overrides
- Security: Strengthened validation and invariant enforcement beyond raw suggestions.
- Consistency: Unified response envelope; AI suggestions varied in shape.
- Maintainability: Added explicit comments & grouping for scalability.
- Accuracy: Ensured aggregation pipeline handles ObjectId conversion and missing usernames.

## 7. Lessons Learned
- AI accelerates boilerplate (validation arrays, basic routes) but requires human oversight for domain rules.
- Aggregation queries benefit from manual reasoning to avoid subtle mismatches (string vs ObjectId).
- Documentation quality relies on human context synthesis; AI drafts can help outline but not finalize nuanced rubric mapping.

## 8. Pending AI-Related Artifacts
- `REFLECTION.md` (will expand on workflow evolution & decision ethics).
- Potential test generation assistance (Jest + Supertest scaffolds) – will log additional AI contributions here if used.

## 9. Integrity Statement
All security-sensitive decisions (password hashing strategy, invariant enforcement, duplicate request prevention) were manually reviewed before acceptance. AI suggestions never directly modified secrets or uncontrolled side-effect logic without inspection.

## 10. Future Logging Procedure
For subsequent tasks (tests, reflection):
1. Note prompt intent.
2. Capture raw suggestion gist.
3. Record classification & modifications.
4. Append incremental entry to this file.

---
Last updated: 2025-11-08
Maintainer: Phase 2 AI-assisted team
