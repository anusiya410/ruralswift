require('dotenv').config();
const { pool } = require('./server/src/config/db');

async function fix() {
  await pool.query("UPDATE orders SET status = 'packed', delivery_run_id = NULL WHERE order_id = 13");
  console.log("Fixed Order 13");
  process.exit(0);
}

fix();
