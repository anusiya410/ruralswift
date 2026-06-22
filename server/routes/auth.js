// server/routes/auth.js
// POST /api/auth/register  — create new user
// POST /api/auth/login     — login existing user, return JWT
// Matches REAL NeonDB schema: users(user_id, name, email, phone, password, address)
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const pool    = require('../db');

// ─────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { first_name, last_name, email, phone, password } = req.body;
  // Combine first+last into the 'name' column
  const name = `${(first_name || '').trim()} ${(last_name || '').trim()}`.trim();

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Check duplicate email
    const existing = await pool.query(
      'SELECT user_id FROM users WHERE email = $1', [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, phone, password)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, name, email, phone`,
      [name, email, phone || '', hashedPassword]
    );

    const user      = result.rows[0];
    const nameParts = (user.name || '').split(' ');
    const token     = jwt.sign(
      { id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        id:         user.user_id,
        first_name: nameParts[0] || '',
        last_name:  nameParts.slice(1).join(' ') || '',
        name:       user.name,
        email:      user.email,
        phone:      user.phone
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const result = await pool.query(
      'SELECT user_id, name, email, phone, password FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user    = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token     = jwt.sign(
      { id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    const nameParts = (user.name || '').split(' ');

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id:         user.user_id,
        first_name: nameParts[0] || '',
        last_name:  nameParts.slice(1).join(' ') || '',
        name:       user.name,
        email:      user.email,
        phone:      user.phone
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

module.exports = router;
