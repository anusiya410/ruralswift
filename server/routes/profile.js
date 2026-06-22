// server/routes/profile.js
// GET /api/profile   — fetch logged-in user's profile
// PUT /api/profile   — update logged-in user's profile
// Matches REAL NeonDB schema: users(user_id, name, email, phone, address, gender, avatar_url)
const express          = require('express');
const router           = express.Router();
const pool             = require('../db');
const authenticateToken = require('../middleware/auth');

// ─────────────────────────────────────────────────────────
// GET /api/profile
// ─────────────────────────────────────────────────────────
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, name, email, phone, address, gender, avatar_url, created_at
       FROM users WHERE user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const u         = result.rows[0];
    const nameParts = (u.name || '').split(' ');

    res.json({
      user: {
        id:         u.user_id,
        first_name: nameParts[0] || '',
        last_name:  nameParts.slice(1).join(' ') || '',
        name:       u.name,
        email:      u.email,
        phone:      u.phone,
        address:    u.address,
        gender:     u.gender,
        avatar_url: u.avatar_url,
        created_at: u.created_at
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server error fetching profile.' });
  }
});

// ─────────────────────────────────────────────────────────
// PUT /api/profile
// ─────────────────────────────────────────────────────────
router.put('/', authenticateToken, async (req, res) => {
  const { first_name, last_name, email, phone, address, gender } = req.body;

  try {
    // Build full name from first + last
    const fields = [];
    const values = [];
    let   index  = 1;

    // Combine first+last into 'name' column
    if (first_name !== undefined || last_name !== undefined) {
      // Fetch current name to preserve parts not sent
      const curr = await pool.query(
        'SELECT name FROM users WHERE user_id = $1', [req.user.id]
      );
      const currentName   = curr.rows[0]?.name || '';
      const currentParts  = currentName.split(' ');
      const newFirst = first_name !== undefined ? first_name.trim() : (currentParts[0] || '');
      const newLast  = last_name  !== undefined ? last_name.trim()  : (currentParts.slice(1).join(' ') || '');
      const newName  = `${newFirst} ${newLast}`.trim();
      fields.push(`name = $${index++}`);
      values.push(newName);
    }

    if (email   !== undefined) { fields.push(`email = $${index++}`);   values.push(email);   }
    if (phone   !== undefined) { fields.push(`phone = $${index++}`);   values.push(phone);   }
    if (address !== undefined) { fields.push(`address = $${index++}`); values.push(address); }
    if (gender  !== undefined) { fields.push(`gender = $${index++}`);  values.push(gender);  }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields provided to update.' });
    }

    fields.push(`updated_at = NOW()`);
    values.push(req.user.id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE user_id = $${index}
      RETURNING user_id, name, email, phone, address, gender, avatar_url
    `;

    const result    = await pool.query(query, values);
    const u         = result.rows[0];
    const nameParts = (u.name || '').split(' ');

    res.json({
      message: 'Profile updated successfully.',
      user: {
        id:         u.user_id,
        first_name: nameParts[0] || '',
        last_name:  nameParts.slice(1).join(' ') || '',
        name:       u.name,
        email:      u.email,
        phone:      u.phone,
        address:    u.address,
        gender:     u.gender,
        avatar_url: u.avatar_url
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ message: 'This email is already in use.' });
    }
    res.status(500).json({ message: 'Server error updating profile.' });
  }
});

module.exports = router;
