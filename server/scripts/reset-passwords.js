// server/scripts/reset-passwords.js
// Run: node server/scripts/reset-passwords.js
'use strict';

const path   = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  const NEW_PASSWORD = 'RuralSwift@123';
  const hash = await bcrypt.hash(NEW_PASSWORD, 12);

  const { rows } = await pool.query(
    `UPDATE users SET password = $1 WHERE is_email_verified = TRUE RETURNING email, user_id, role`,
    [hash]
  );

  console.log('\n✅  Passwords reset successfully for:');
  rows.forEach(r => console.log(`   [user_id=${r.user_id}] ${r.email} (${r.role})`));
  console.log(`\n🔑  New password for ALL accounts: ${NEW_PASSWORD}\n`);
  await pool.end();
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
