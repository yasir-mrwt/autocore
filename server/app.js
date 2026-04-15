const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes Placeholder

// Basic route for testing
app.get('/', (req, res) => {
    res.send('AutoPartPro API is running...');
});

module.exports = app;
