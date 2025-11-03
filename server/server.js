// server.js
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const app = express();
const logger = require('./logger');
const port = 3001; // Or any other desired port

// In-memory user storage
const users = [];

app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://2024tm93271_db_user:comCCmPxYV1Hj6Gn@school-equipment-lendin.bx2rbqg.mongodb.net/?appName=school-equipment-lending-portal";
const client = new MongoClient(uri);
let userCollection;

async function run() {
    try {
        await client.connect();
        const database = client.db("school-equipment-lending-portal");
        userCollection = database.collection("users");
        console.log("Connected to MongoDB");
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);

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