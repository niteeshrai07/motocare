const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check route (temporary — will remove once we have real endpoints to check)
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MotoCare API is running',
    data: null,
    errors: null,
  });
});

// Routes
app.use('/api/v1/auth', authRoutes);

module.exports = app;