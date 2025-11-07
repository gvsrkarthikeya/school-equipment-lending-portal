// server.js
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const app = express();
const logger = require('./logger');
const port = 3001; // Or any other desired port

// JWT secret - for development use env var, otherwise fallback to a dev secret
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Express middleware
app.use(cors());
app.use(express.json());

// MongoDB connection URI and client setup
const uri = "mongodb+srv://2024tm93271_db_user:comCCmPxYV1Hj6Gn@school-equipment-lendin.bx2rbqg.mongodb.net/?appName=school-equipment-lending-portal";
const client = new MongoClient(uri);
let userCollection;
let equipmentsCollection;
let requestsCollection;

// Connect to MongoDB and cache collection references.
async function run() {
    try {
        logger.info('Attempting to connect to MongoDB...');
        await client.connect();
        const database = client.db("school-equipment-lending-portal");
        userCollection = database.collection("users");
        equipmentsCollection = database.collection("equipments");
        requestsCollection = database.collection("requests");
        logger.info('Connected to MongoDB and initialized collections: users, equipments, requests');
    } catch (err) {
        logger.error(`MongoDB connection error: ${err && err.message}`);
        throw err;
    } finally {
        // Keep connection open for the lifetime of the server. Do not close here.
    }
}

// Static equipment data
const staticEquipment = [
    { _id: '1', name: 'Microscope', category: 'Science Lab', condition: 'Good', quantity: 5, available: 5 },
    { _id: '2', name: 'Camera', category: 'Media', condition: 'Needs Repair', quantity: 2, available: 1 },
    { _id: '3', name: 'Football', category: 'Sports', condition: 'Good', quantity: 10, available: 10 }
];

// Static requests data
const staticRequests = [];

/* API for getting equipment details */
/**
 * GET /api/equipment
 * Returns list of equipment with `available` calculated as quantity minus
 * number of approved requests for that equipment.
 */
app.get('/api/equipment', async (req, res) => {
    logger.info('GET /api/equipment called');
    try {
        const equipments = await equipmentsCollection.find({}).toArray();
        logger.info(`Fetched ${equipments.length} equipment items`);
        // Return stored availability values
        res.json(equipments);
    } catch (error) {
        logger.error(`Error fetching equipment: ${error && error.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/* API for adding new equipment */
app.post('/api/equipment', async (req, res) => {
    // Adds a new equipment document to the `equipments` collection.
    const { name, category, condition, quantity, available } = req.body;
    logger.info(`POST /api/equipment called - name=${name}`);
    try {
        const newEq = { name, category, condition, quantity, available };
        const result = await equipmentsCollection.insertOne(newEq);
        newEq._id = result.insertedId;
        logger.info(`Equipment inserted with _id=${result.insertedId}`);
        res.json(newEq);
    } catch (error) {
        logger.error(`Error adding equipment: ${error && error.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
});


/* API for getting all requests */
app.get('/api/requests', async (req, res) => {
    logger.info('GET /api/requests called');
    try {
        const requests = await requestsCollection.find({}).toArray();
        logger.info(`Returning ${requests.length} requests`);
        res.json(requests);
    } catch (error) {
        logger.error(`Error fetching requests: ${error && error.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
});


/* API for updating equipment details */
app.put('/api/equipment/:id', async (req, res) => {
    const { id } = req.params;
    const { name, category, condition, quantity, available } = req.body;
    logger.info(`PUT /api/equipment/${id} called`);
    try {
        const result = await equipmentsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { name, category, condition, quantity, available } }
        );
        if (result.matchedCount === 0) {
            logger.info(`Equipment id=${id} not found`);
            return res.status(404).json({ message: 'Equipment not found' });
        }
        logger.info(`Equipment id=${id} updated (modifiedCount=${result.modifiedCount})`);
        res.json({ message: 'Equipment updated' });
    } catch (error) {
        logger.error(`Error updating equipment: ${error && error.message}`, error);
        return res.status(500).json({ message: 'Internal server error' });
    }

});


/* API for deleting equipment */
app.delete('/api/equipment/:id', async (req, res) => {
    const { id } = req.params;
    logger.info(`DELETE /api/equipment/${id} called`);
    try {
        const result = await equipmentsCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            logger.info(`Equipment id=${id} not found for delete`);
            return res.status(404).json({ message: 'Equipment not found' });
        }
        logger.info(`Deleted equipment id=${id}`);
        res.json({ message: 'Equipment deleted' });
    } catch (error) {
        logger.error(`Error deleting equipment: ${error && error.message}`, error);
        return res.status(500).json({ message: 'Internal server error' });
    }

});


// Requests Endpoints (STATIC ONLY)


/* API for creating a new request */
app.post('/api/requests', async (req, res) => {
    const { equipmentId, user, status } = req.body;
    logger.info(`POST /api/requests called by user=${user} for equipmentId=${equipmentId}`);
    try {
        const newReq = { equipmentId, user, status };
        const result = await requestsCollection.insertOne(newReq);
        newReq._id = result.insertedId;
        logger.info(`Inserted request id=${result.insertedId}`);
        res.json(newReq);
    } catch (error) {
        logger.error(`Error creating request: ${error && error.message}`, error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


/* API for updating request status (approve, reject, return) */
app.put('/api/requests/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    logger.info(`PUT /api/requests/${id} -> status=${status}`);
    try {
        // Fetch existing request to understand previous status and target equipment
        const existingReq = await requestsCollection.findOne({ _id: new ObjectId(id) });
        if (!existingReq) {
            logger.info(`Request id=${id} not found`);
            return res.status(404).json({ message: 'Request not found' });
        }

        // Determine how availability should change
        let delta = 0;
        const prevStatus = existingReq.status;
        if (prevStatus !== 'approved' && status === 'approved') {
            // Moving into approved -> consume 1 availability
            delta = -1;
        } else if (prevStatus === 'approved' && status === 'returned') {
            // Only returning releases availability; rejected should NOT change availability
            delta = +1;
        }

        // Update equipment availability if needed
        if (delta !== 0) {
            const equipmentObjectId = new ObjectId(existingReq.equipmentId+'');
            let eqUpdateResult;
            if (delta < 0) {
                // Ensure we don't go below zero availability
                eqUpdateResult = await equipmentsCollection.updateOne(
                    { _id: equipmentObjectId, available: { $gt: 0 } },
                    { $inc: { available: -1 } }
                );
                if (eqUpdateResult.modifiedCount === 0) {
                    logger.info(`No availability to approve for equipment=${existingReq.equipmentId}`);
                    return res.status(400).json({ message: 'No availability for this equipment' });
                }
            } else {
                // Increase availability (no hard cap enforced here)
                eqUpdateResult = await equipmentsCollection.updateOne(
                    { _id: equipmentObjectId },
                    { $inc: { available: 1 } }
                );
            }
            logger.info(`Adjusted equipment ${existingReq.equipmentId} availability by ${delta}`);
        }

        // Finally, update the request status
        const result = await requestsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { status } }
        );
        logger.info(`Request id=${id} updated to status=${status} (modifiedCount=${result.modifiedCount})`);
        res.json({ message: 'Request updated' });
    } catch (error) {
        logger.error(`Error updating request: ${error && error.message}`, error);
        return res.status(500).json({ message: 'Internal server error' });
    }

});

run().catch(console.dir);

// Simple JWT-based authenticate middleware
function authenticate(req, res, next) {
    const auth = req.headers['authorization'];
    if (!auth) return res.status(401).json({ message: 'No token provided' });
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ message: 'Invalid authorization format' });
    const token = parts[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = { username: payload.username, role: payload.role };
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}
app.post('/api/signup', async (req, res) => {
    const { username, password, role } = req.body;
    logger.info(`Signup request: ${JSON.stringify(req.body)}`);
    try {
        // Check if user already exists in MongoDB
        const existingUser = await userCollection.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: 'Username already exists!' });
        }

        // Insert new user into MongoDB
        await userCollection.insertOne({
            username,
            password,
            role,
            createdAt: new Date()
        });

        res.json({ message: 'success' });
    } catch (error) {
        logger.error(`Signup error: ${error.message}`, error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Login route
/* API for user login */
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    logger.info(`Login request: ${JSON.stringify(req.body)}`);
    try {
        const user = await userCollection.findOne({ username, password });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials!' });
        }
    // Issue a JWT
    const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, role: user.role });
    } catch (error) {
        logger.error(`Login error: ${error.message}`, error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Simple endpoint to verify token and return user info
app.get('/api/me', authenticate, (req, res) => {
    res.json({ username: req.user.username, role: req.user.role });
});

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});