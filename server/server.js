// server.js - Phase 2: AI-Assisted Refactored Version
// Enhancements: Security, validation, error handling, performance, authorization

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { body, param, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');
const logger = require('./logger');

// ENVIRONMENT
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'school-equipment-lending-portal';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!MONGODB_URI) {
    logger.error('FATAL: MONGODB_URI environment variable is not set');
    process.exit(1);
}

if (!JWT_SECRET || JWT_SECRET === 'dev-secret-change-me') {
    if (NODE_ENV === 'production') {
        logger.error('FATAL: JWT_SECRET must be changed in production');
        process.exit(1);
    }
    logger.warn('Using default JWT_SECRET. Change this in production.');
}

const app = express();

// Security / performance middlewares
app.use(helmet());
app.use(cors({ origin: NODE_ENV === 'production' ? process.env.ALLOWED_ORIGINS?.split(',') : '*' }));
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// rate limiters removed during development to avoid unexpected 429s
// Re-enable in production with: express-rate-limit

// DB
const client = new MongoClient(MONGODB_URI, { maxPoolSize: 10, minPoolSize: 2, maxIdleTimeMS: 30000 });
let db;
let userCollection;
let equipmentsCollection;
let requestsCollection;

async function createIndexes() {
    try {
        await userCollection.createIndex({ username: 1 }, { unique: true });
        await equipmentsCollection.createIndex({ name: 1 });
        await equipmentsCollection.createIndex({ category: 1 });
        await equipmentsCollection.createIndex({ available: 1 });
        await requestsCollection.createIndex({ user: 1 });
        await requestsCollection.createIndex({ equipmentId: 1 });
        await requestsCollection.createIndex({ status: 1 });
    } catch (err) {
        logger.warn('Index creation warning: ' + err.message);
    }
}

async function connectDB() {
    try {
        logger.info('Connecting to MongoDB...');
        await client.connect();
        db = client.db(DB_NAME);
        userCollection = db.collection('usersai');  // Phase 2 uses separate collection
        equipmentsCollection = db.collection('equipments');
        requestsCollection = db.collection('requests');
        await createIndexes();
        logger.info('Connected to MongoDB (using usersai collection for Phase 2)');
    } catch (err) {
        logger.error('MongoDB connection error: ' + err.message);
        throw err;
    }
}

// Auth middlewares
function authenticate(req, res, next) {
    const auth = req.headers['authorization'];
    if (!auth) return res.status(401).json({ success: false, message: 'No token provided' });
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ success: false, message: 'Invalid authorization format' });
    const token = parts[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = { id: payload.sub, username: payload.username, role: payload.role };
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
}

function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
        if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Forbidden' });
        next();
    };
}

function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    next();
}

// Validation rules
const validationRules = {
    signup: [
        body('username').trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
        body('password').isLength({ min: 6 }),
        body('role').isIn(['student', 'staff', 'admin'])
    ],
    login: [body('username').trim().notEmpty(), body('password').notEmpty()],
    addEquipment: [body('name').notEmpty(), body('category').notEmpty(), body('condition').notEmpty(), body('quantity').isInt({ min: 1 })],
    updateEquipment: [param('id').isMongoId()],
    createRequest: [body('equipmentId').isMongoId(), body('user').notEmpty(), body('status').isIn(['pending','approved','rejected','returned'])],
    updateRequest: [param('id').isMongoId(), body('status').isIn(['pending','approved','rejected','returned'])]
};

// Health and API info
app.get('/health', (req, res) => {
    const dbConnected = client.topology && client.topology.isConnected && typeof client.topology.isConnected === 'function' ? client.topology.isConnected() : true;
    res.status(dbConnected ? 200 : 503).json({ success: dbConnected, uptime: process.uptime(), timestamp: Date.now() });
});

app.get('/api', (req, res) => res.json({ success: true, name: 'School Equipment Lending Portal API', phase: 'Phase 2' }));

// AUTH
app.post('/api/signup', validationRules.signup, handleValidationErrors, async (req, res, next) => {
    try {
        const { username, password, role } = req.body;
        const existing = await userCollection.findOne({ username });
        if (existing) return res.status(409).json({ success: false, message: 'Username exists' });
        const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const result = await userCollection.insertOne({ username, password: hashed, role, createdAt: new Date(), updatedAt: new Date() });
        res.status(201).json({ success: true, userId: result.insertedId.toString() });
    } catch (err) { next(err); }
});

app.post('/api/login', validationRules.login, handleValidationErrors, async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const user = await userCollection.findOne({ username });
        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        const token = jwt.sign({ sub: user._id.toString(), username: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.json({ success: true, token, role: user.role, user: { id: user._id.toString(), username: user.username, role: user.role } });
    } catch (err) { next(err); }
});

app.get('/api/me', authenticate, (req, res) => {
    res.json({ success: true, user: req.user });
});

// EQUIPMENT
app.get('/api/equipment', async (req, res, next) => {
    try {
        const { category, available, search } = req.query;
        const q = {};
        if (category) q.category = category;
        if (available !== undefined) q.available = { $gte: parseInt(available, 10) };
        if (search) q.$or = [{ name: { $regex: search, $options: 'i' } }, { category: { $regex: search, $options: 'i' } }];
        const list = await equipmentsCollection.find(q).toArray();
        res.json({ success: true, count: list.length, data: list });
    } catch (err) { next(err); }
});

app.post('/api/equipment', authenticate, authorize('admin'), validationRules.addEquipment, handleValidationErrors, async (req, res, next) => {
    try {
        const { name, category, condition, quantity, available } = req.body;
        const eq = { name, category, condition, quantity, available: available !== undefined ? available : quantity, createdBy: req.user.username, createdAt: new Date(), updatedAt: new Date() };
        const result = await equipmentsCollection.insertOne(eq);
        eq._id = result.insertedId;
        res.status(201).json({ success: true, data: eq });
    } catch (err) { next(err); }
});

app.put('/api/equipment/:id', authenticate, authorize('admin'), validationRules.updateEquipment, handleValidationErrors, async (req, res, next) => {
    try {
        const { id } = req.params; const updates = { updatedAt: new Date(), updatedBy: req.user.username };
        const allowed = ['name','category','condition','quantity','available'];
        allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
        
        // Enforce invariant: available <= quantity
        // If quantity is being reduced, cap available to not exceed new quantity
        if (updates.quantity !== undefined) {
            const existing = await equipmentsCollection.findOne({ _id: new ObjectId(id) });
            if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
            
            // If new quantity is less than current available, cap available
            const newQuantity = updates.quantity;
            const currentAvailable = updates.available !== undefined ? updates.available : existing.available;
            if (currentAvailable > newQuantity) {
                updates.available = newQuantity;
            }
        }
        
        const result = await equipmentsCollection.updateOne({ _id: new ObjectId(id) }, { $set: updates });
        if (result.matchedCount === 0) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, modifiedCount: result.modifiedCount });
    } catch (err) { next(err); }
});

app.delete('/api/equipment/:id', authenticate, authorize('admin'), validationRules.updateEquipment, handleValidationErrors, async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await equipmentsCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true });
    } catch (err) { next(err); }
});

// REQUESTS
app.get('/api/requests', authenticate, async (req, res, next) => {
    try {
        const q = {};
        if (req.user.role === 'student') q.user = req.user.username;
        const list = await requestsCollection.find(q).toArray();
        res.json({ success: true, count: list.length, data: list });
    } catch (err) { next(err); }
});

app.post('/api/requests', authenticate, validationRules.createRequest, handleValidationErrors, async (req, res, next) => {
    try {
        const { equipmentId, user, status } = req.body;
        const equipment = await equipmentsCollection.findOne({ _id: new ObjectId(equipmentId) });
        if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found' });
        if (equipment.available <= 0 && status === 'pending') return res.status(400).json({ success: false, message: 'No availability' });
        
        // Prevent duplicate pending requests for the same user and equipment
        const existingPending = await requestsCollection.findOne({ 
            equipmentId, 
            user, 
            status: 'pending' 
        });
        if (existingPending) return res.status(409).json({ success: false, message: 'Request already pending for this equipment' });
        
        const reqDoc = { equipmentId, user, status, createdAt: new Date(), updatedAt: new Date() };
        const result = await requestsCollection.insertOne(reqDoc);
        reqDoc._id = result.insertedId;
        res.status(201).json({ success: true, data: reqDoc });
    } catch (err) { next(err); }
});

app.put('/api/requests/:id', authenticate, authorize('staff','admin'), validationRules.updateRequest, handleValidationErrors, async (req, res, next) => {
    try {
        const { id } = req.params; const { status } = req.body;
        const existing = await requestsCollection.findOne({ _id: new ObjectId(id) });
        if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
        let delta = 0; if (existing.status !== 'approved' && status === 'approved') delta = -1; else if (existing.status === 'approved' && status === 'returned') delta = +1;
        if (delta !== 0) {
            const equipmentObjectId = new ObjectId(existing.equipmentId);
            if (delta < 0) {
                const eqUpdate = await equipmentsCollection.updateOne({ _id: equipmentObjectId, available: { $gt: 0 } }, { $inc: { available: -1 }, $set: { updatedAt: new Date() } });
                if (eqUpdate.modifiedCount === 0) return res.status(400).json({ success: false, message: 'No availability' });
            } else {
                await equipmentsCollection.updateOne({ _id: equipmentObjectId }, { $inc: { available: 1 }, $set: { updatedAt: new Date() } });
            }
        }
        const result = await requestsCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status, updatedAt: new Date(), updatedBy: req.user.username } });
        res.json({ success: true, modifiedCount: result.modifiedCount });
    } catch (err) { next(err); }
});

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
    logger.error(err && err.stack ? err.stack : String(err));
    if (err.name === 'MongoServerError') return res.status(500).json({ success: false, message: 'Database error' });
    res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

// Graceful shutdown
// Note: During development we've seen unexpected process termination in some
// environments. To avoid accidental exits while debugging, close the MongoDB
// client but do NOT call process.exit() automatically here. If you want the
// server to exit on SIGINT/SIGTERM in production, re-enable the handlers.
async function gracefulShutdown() {
    try {
        await client.close();
        logger.info('MongoDB closed (gracefulShutdown completed)');
        // Intentionally NOT calling process.exit() here to prevent accidental
        // termination of the Node process during development/test runs.
    } catch (err) {
        logger.error('Error during graceful shutdown: ' + (err && err.message ? err.message : String(err)));
    }
}
// Automatic signal handlers are commented out to avoid unexpected shutdowns
// during development. Uncomment in production if desired.
// process.on('SIGINT', gracefulShutdown);
// process.on('SIGTERM', gracefulShutdown);

// Start
connectDB().then(() => {
    app.listen(PORT, () => {
        logger.info(`Server started on http://localhost:${PORT}`);
    });
}).catch(err => { logger.error('Startup failed: ' + err.message); process.exit(1); });

module.exports = app;