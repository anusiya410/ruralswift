// server/db.js
// NeonDB (PostgreSQL) connection using the pg Pool
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true  // NeonDB pooler requires SSL; channel_binding is handled via the connection string
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌  Database connection error:', err.message);
  } else {
    console.log('✅  Connected to NeonDB (PostgreSQL)');
    release();
  }
});

module.exports = pool;
