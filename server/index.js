// server/index.js
// RuralSwift Express API Server — entry point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const createTables = require('./schema');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

const app = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:4200', 'https://ruralshift-test.netlify.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB init handled by schema.js

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'RuralSwift API is running 🚀' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error.' });
});

// ─────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────
createTables().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀  RuralSwift API running at http://localhost:${PORT}`);
    console.log(`📋  Routes:`);
    console.log(`    POST  /api/auth/register`);
    console.log(`    POST  /api/auth/login`);
    console.log(`    GET   /api/profile`);
    console.log(`    PUT   /api/profile`);
    console.log(`    GET   /api/health\n`);
  });
});
