# Setup Instructions (Manual Development – Main Branch)

These steps help run the manual version of the project locally for assignment evaluation.

## 1. Prerequisites
- Node.js (LTS) installed
- Access to the MongoDB Atlas cluster (URI currently hard-coded in `server/server.js`)

## 2. Backend Setup
```bash
cd server
node server.js
```
Server starts on: http://localhost:3001

If connection fails, verify MongoDB URI in `server/server.js`.

## 3. Frontend Setup
```bash
cd client
npm install
npm start
```
Opens React app (default http://localhost:3000).

## 4. Basic Usage Flow
1. Signup (choose role) at login page.
2. Login with the same credentials.
3. Dashboard shows equipment and requests.
4. As a "student" create a borrow request.
5. Change request status manually (approve/return) using dashboard if you have staff/admin role.

## 5. Test Quick Commands (curl)
Signup:
```bash
curl -X POST http://localhost:3001/api/signup -H "Content-Type: application/json" -d '{"username":"test1","password":"pass1","role":"student"}'
```
Login:
```bash
curl -X POST http://localhost:3001/api/login -H "Content-Type: application/json" -d '{"username":"test1","password":"pass1"}'
```
List equipment:
```bash
curl http://localhost:3001/api/equipment
```

## 6. Known Manual Version Limitations
- No password hashing
- No RBAC enforcement on routes
- All requests visible to any user
- Potential duplicate pending requests

## 7. Suggested Improvements (Not Implemented Here)
- Move MongoDB URI + JWT secret to `.env`
- Add input validation
- Add bcrypt password hashing
- Restrict routes by role

---
End of manual setup instructions.
