// server/src/middleware/auth.middleware.js
'use strict';

const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * authenticateToken — verifies the Bearer JWT on every protected route.
 * Attaches req.user = { id, email, role } on success.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return sendError(res, 401, 'Access denied. No token provided.', 'AUTH_NO_TOKEN');
  }

  try {
    const secret = process.env.JWT_SECRET || 'ruralswift_jwt_secret_2024_change_in_production';
    const decoded = jwt.verify(token, secret);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role || 'customer' };
    next();
  } catch (err) {
    logger.warn('JWT verification failed', { requestId: req.id, error: err.message });
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Session expired. Please log in again.', 'AUTH_TOKEN_EXPIRED');
    }
    return sendError(res, 401, 'Invalid token. Please log in again.', 'AUTH_INVALID_TOKEN');
  }
}

/**
 * requireRole — factory that returns middleware allowing only a specific role.
 * Usage: router.get('/route', authenticateToken, requireRole('seller'), handler)
 */
function requireRole(role) {
  return function (req, res, next) {
    if (!req.user) {
      return sendError(res, 401, 'Unauthorized.', 'AUTH_REQUIRED');
    }
    if (req.user.role !== role && req.user.role !== 'admin') {
      return sendError(
        res, 403,
        `Access denied. This action requires the '${role}' role.`,
        'AUTH_INSUFFICIENT_ROLE'
      );
    }
    next();
  };
}

module.exports = authenticateToken;
module.exports.requireRole = requireRole;
