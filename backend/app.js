const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const repairShopRoutes = require('./routes/repairShop.routes');
const serviceRequestRoutes = require('./routes/serviceRequest.routes');
const notificationRoutes = require('./routes/notification.routes');


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
app.use('/api/v1/repair-shops', repairShopRoutes);
app.use('/api/v1/service-requests', serviceRequestRoutes);
app.use('/api/v1/notifications', notificationRoutes);

module.exports = app;