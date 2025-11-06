// server.js
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const app = express();
const logger = require('./logger');
const port = 3001; // Or any other desired port

app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://2024tm93271_db_user:comCCmPxYV1Hj6Gn@school-equipment-lendin.bx2rbqg.mongodb.net/?appName=school-equipment-lending-portal";
const client = new MongoClient(uri);
let userCollection;
let equipmentCollection;
let requestCollection;

async function run() {
    try {
        await client.connect();
        const database = client.db("school-equipment-lending-portal");
        userCollection = database.collection("users");
        equipmentCollection = database.collection("equipment");
        requestCollection = database.collection("requests");
        console.log("Connected to MongoDB");

    } finally {
        // await client.close();
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
app.get('/api/equipment', (req, res) => {
    // Calculate available based on approved requests
    const equipmentWithAvailable = staticEquipment.map(eq => {
        // Count approved requests for this equipment
        const approvedCount = staticRequests.filter(r => r.equipmentId === eq._id && r.status === 'approved').length;
        return {
            ...eq,
            available: eq.quantity - approvedCount
        };
    });
    res.json(equipmentWithAvailable);
});

/* API for adding new equipment */
app.post('/api/equipment', (req, res) => {
    const { name, category, condition, quantity, available } = req.body;
    const newEq = {
        _id: (staticEquipment.length + 1).toString(),
        name,
        category,
        condition,
        quantity,
        available
    };
    staticEquipment.push(newEq);
    res.json(newEq);
});


/* API for getting all requests */
app.get('/api/requests', (req, res) => {
    res.json(staticRequests);
});


/* API for updating equipment details */
app.put('/api/equipment/:id', (req, res) => {
    const { id } = req.params;
    const { name, category, condition, quantity, available } = req.body;
    const idx = staticEquipment.findIndex(eq => eq._id === id);
    if (idx === -1) {
        return res.status(404).json({ message: 'Equipment not found' });
    }
    staticEquipment[idx] = { _id: id, name, category, condition, quantity, available };
    res.json({ message: 'Equipment updated' });
});


/* API for deleting equipment */
app.delete('/api/equipment/:id', (req, res) => {
    const { id } = req.params;
    const idx = staticEquipment.findIndex(eq => eq._id === id);
    if (idx === -1) {
        return res.status(404).json({ message: 'Equipment not found' });
    }
    staticEquipment.splice(idx, 1);
    res.json({ message: 'Equipment deleted' });
});


// Requests Endpoints (STATIC ONLY)


/* API for creating a new request */
app.post('/api/requests', (req, res) => {
    const { equipmentId, user, status } = req.body;
    const newReq = {
        _id: (staticRequests.length + 1).toString(),
        equipmentId,
        user,
        status
    };
    staticRequests.push(newReq);
    res.json(newReq);
});


/* API for updating request status (approve, reject, return) */
app.put('/api/requests/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const idx = staticRequests.findIndex(r => r._id === id);
    if (idx === -1) {
        return res.status(404).json({ message: 'Request not found' });
    }
    staticRequests[idx].status = status;
    res.json({ message: 'Request updated' });
});
    
run().catch(console.dir);

/* API for user signup */
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
        logger.error(`Signup error: ${error.message}`);
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
        // Simulate token (for now, just a string)
        const token = 'dummy-token';
        res.json({ token, role: user.role });
    } catch (error) {
        logger.error(`Login error: ${error.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});