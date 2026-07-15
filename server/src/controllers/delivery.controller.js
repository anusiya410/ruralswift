'use strict';
const deliveryService = require('../services/delivery.service');
const { sendSuccess, sendError } = require('../utils/response');

class DeliveryController {
  async createRun(req, res, next) {
    try {
      const { driverId, orderIds } = req.body;
      if (!driverId || !orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return sendError(res, 400, 'driverId and an array of orderIds are required.', 'VALIDATION_ERROR');
      }
      // Assuming sellerId is the user who made the request (the hub manager)
      const result = await deliveryService.createDeliveryRun(driverId, req.user.id, orderIds);
      return sendSuccess(res, 201, 'Delivery run optimized and created.', { data: result });
    } catch (err) {
      next(err);
    }
  }

  async getRuns(req, res, next) {
    try {
      const runs = await deliveryService.getDriverRuns(req.user.id);
      return sendSuccess(res, 200, 'Delivery runs fetched.', { data: { runs } });
    } catch (err) {
      next(err);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const { status, deliveryOtp } = req.body;
      const orderId = parseInt(req.params.id);
      
      // We can reuse the order service logic for this to ensure consistency and OTP validation
      const orderService = require('../services/order.service');
      const order = await orderService.updateOrderStatus(orderId, status, { deliveryOtp });
      
      return sendSuccess(res, 200, 'Order marked as delivered.', { data: { order } });
    } catch (err) {
      if (err.message.includes('not found')) return sendError(res, 404, err.message, 'ORDER_NOT_FOUND');
      if (err.message.includes('Invalid Delivery OTP')) return sendError(res, 400, err.message, 'INVALID_OTP');
      next(err);
    }
  }
}

module.exports = new DeliveryController();
