// server.js
const express = require('express');
const cors = require('cors');
const app = express();
const logger = require('./logger');
const port = 3001; // Or any other desired port

// In-memory user storage
const users = [];

app.use(cors());
app.use(express.json());


app.post('/api/signup', (req, res) => {
    const { username, password, role } = req.body;
    logger.info(`Signup request: ${JSON.stringify(req.body)}`);
    // Check if user already exists
    if (users.find(u => u.username === username)) {
        return res.status(409).json({ message: 'Username already exists!' });
    }
    users.push({ username, password, role });
    res.json({ message: 'success' });
});

// Login route
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    logger.info(`Login request: ${JSON.stringify(req.body)}`);
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials!' });
    }
    // Simulate token (for now, just a string)
    const token = 'dummy-token';
    res.json({ token, role: user.role });
});

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});