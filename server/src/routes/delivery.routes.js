'use strict';
const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/delivery.controller');
const authenticateToken = require('../middleware/auth.middleware');

router.use(authenticateToken);

// Sellers/Admins use this to bundle orders and create a route
router.post('/delivery-runs', deliveryController.createRun);

// Drivers use this to fetch their optimized routes
router.get('/delivery-runs', deliveryController.getRuns);

// Drivers use this to update an order (e.g., mark as delivered with OTP)
router.put('/delivery-runs/orders/:id/status', deliveryController.updateOrderStatus);

module.exports = router;
