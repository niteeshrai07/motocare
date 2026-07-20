const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route (temporary — will move to routes/ once we add real endpoints)
app.get('/', (req, res) => {
  res.send('MotoCare API is running 🔧');
});

module.exports = app;