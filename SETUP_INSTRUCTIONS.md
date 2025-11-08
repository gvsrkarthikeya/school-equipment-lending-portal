# Setup Instructions (Phase 2)

Server enhanced (`server/server.js`) with security, validation, analytics. Rate limiting is disabled in dev to avoid 429 responses.

## Quick Setup Instructions

1. Ensure `server.js.backup` exists (Phase1 snapshot).
2. Confirm `.env` has valid MongoDB credentials.
3. Install dependencies (first run):
```bash
cd server
npm install
```
4. Start the server:
```bash
cd server
node server.js
```

5. Expected startup output:
```
===========================================
Server Environment: development
Server listening at http://localhost:3001
Health check: http://localhost:3001/health
===========================================
```

## Test Endpoints

### Health Check
```bash
curl http://localhost:3001/health
```

### API Info
```bash
curl http://localhost:3001/api
```

### Signup (with validation)
```bash
curl -X POST http://localhost:3001/api/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123","role":"student"}'
```

### Login (returns JWT)
```bash
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

Documentation:
- Root `openapi.json` (API spec)
- `API_REFERENCE.md` (quick endpoint guide)
- `ARCHITECTURE.md` (design & flows)
- `AI_ENHANCEMENTS_SUMMARY.md` (security/performance changes)

Next (optional): run client app:
```bash
cd ../client
npm install
npm start
```
