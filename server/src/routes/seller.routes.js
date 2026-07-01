// server/src/routes/seller.routes.js
'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const authenticateToken = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/auth.middleware');
const { sendSuccess, sendError } = require('../utils/response');

router.use(authenticateToken);
router.use(requireRole('seller'));

/** GET /api/seller/dashboard — stats for the seller */
router.get('/seller/dashboard', async (req, res, next) => {
  try {
    const sellerId = req.user.id;

    const [productsRes, ordersRes, revenueRes, lowStockRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM products WHERE seller_id = $1 AND is_active = TRUE`, [sellerId]),
      pool.query(`SELECT COUNT(*) as count FROM orders o JOIN order_items oi ON oi.order_id = o.order_id JOIN products p ON p.product_id = oi.product_id WHERE p.seller_id = $1 AND o.status NOT IN ('cancelled')`, [sellerId]),
      pool.query(`SELECT COALESCE(SUM(oi.unit_price * oi.quantity), 0) as total FROM order_items oi JOIN products p ON p.product_id = oi.product_id JOIN orders o ON o.order_id = oi.order_id WHERE p.seller_id = $1 AND o.status = 'delivered'`, [sellerId]),
      pool.query(`SELECT COUNT(*) as count FROM products WHERE seller_id = $1 AND is_active = TRUE AND stock < 10`, [sellerId])
    ]);

    sendSuccess(res, 200, 'Dashboard data fetched.', {
      totalProducts: parseInt(productsRes.rows[0].count),
      totalOrders: parseInt(ordersRes.rows[0].count),
      totalRevenue: parseFloat(revenueRes.rows[0].total),
      lowStockCount: parseInt(lowStockRes.rows[0].count)
    });
  } catch (err) { next(err); }
});

/** GET /api/seller/orders — orders for seller's products */
router.get('/seller/orders', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const values = [req.user.id];
    const conditions = [`p.seller_id = $1`];
    let idx = 2;

    if (status) { conditions.push(`o.status = $${idx++}`); values.push(status); }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    values.push(parseInt(limit), offset);

    const { rows } = await pool.query(
      `SELECT DISTINCT o.order_id, o.status, o.total, o.delivery_address, o.created_at,
              u.name AS customer_name, u.phone AS customer_phone
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.order_id
       JOIN products p ON p.product_id = oi.product_id
       JOIN users u ON u.user_id = o.user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY o.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      values
    );
    sendSuccess(res, 200, 'Seller orders fetched.', { orders: rows });
  } catch (err) { next(err); }
});

/** PUT /api/seller/orders/:id/status */
router.put('/seller/orders/:id/status', async (req, res, next) => {
  try {
    const { status, trackingNumber } = req.body;
    if (!status) return sendError(res, 400, 'status is required.', 'VALIDATION_ERROR');

    const validStatuses = ['confirmed','packed','shipped','out_for_delivery','delivered'];
    if (!validStatuses.includes(status)) return sendError(res, 400, `Invalid status. Must be one of: ${validStatuses.join(', ')}.`, 'VALIDATION_ERROR');

    const sets = ['status = $1', 'updated_at = NOW()'];
    const values = [status];
    let idx = 2;

    if (trackingNumber) { sets.push(`tracking_number = $${idx++}`); values.push(trackingNumber); }
    if (status === 'delivered') sets.push(`delivered_at = NOW()`);

    values.push(parseInt(req.params.id));
    const { rows } = await pool.query(
      `UPDATE orders SET ${sets.join(', ')} WHERE order_id = $${idx} RETURNING *`,
      values
    );
    if (!rows[0]) return sendError(res, 404, 'Order not found.', 'NOT_FOUND');
    sendSuccess(res, 200, 'Order status updated.', { order: rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
