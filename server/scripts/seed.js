require('dotenv').config({ path: '../.env' });
const { pool } = require('../src/config/db');

const products = [
  { name: 'Paddy Seeds', category: 'Seeds & Fertilizers', price: 899, mrp: 999, stock: 100, unit: 'bag' },
  { name: 'Urea Fertilizer', category: 'Seeds & Fertilizers', price: 1250, mrp: 1450, stock: 50, unit: 'bag' },
  { name: 'Garden Water Spray Pump', category: 'Farming Equipment', price: 1799, mrp: 2199, stock: 20, unit: 'piece' },
  { name: 'Agricultural Hand Sprayer', category: 'Farming Equipment', price: 999, mrp: 1299, stock: 30, unit: 'piece' },
  { name: 'Organic Basmati Rice 5kg', category: 'Groceries', price: 549, mrp: 699, stock: 200, unit: 'bag' },
  { name: 'Fresh Tomatoes', category: 'Groceries', price: 45, mrp: 60, stock: 150, unit: 'kg' },
  { name: 'Premium Wheat Flour', category: 'Groceries', price: 499, mrp: 599, stock: 80, unit: 'bag' },
  { name: 'Cow Milk', category: 'Groceries', price: 68, mrp: 75, stock: 40, unit: 'liter' }
];

async function seed() {
  const client = await pool.connect();
  try {
    // 1. Get or create a dummy user
    let res = await client.query(`SELECT user_id FROM users WHERE email = 'seller@rural.com'`);
    let sellerId;
    if (res.rows.length === 0) {
      console.log('Creating dummy seller user...');
      res = await client.query(`
        INSERT INTO users (name, email, phone, password, is_email_verified)
        VALUES ('Rural Seller', 'seller@rural.com', '9999999999', 'dummy', true)
        RETURNING user_id
      `);
      sellerId = res.rows[0].user_id;

      await client.query(`
        INSERT INTO seller_profiles (user_id, business_name, is_verified)
        VALUES ($1, 'Rural Super Store', true)
      `, [sellerId]);
    } else {
      sellerId = res.rows[0].user_id;
    }

    // 2. Insert products
    console.log(`Inserting products for seller ${sellerId}...`);
    for (const p of products) {
      await client.query(`
        INSERT INTO products (seller_id, name, description, price, mrp, stock, unit, category, is_approved, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, true)
      `, [sellerId, p.name, 'High quality ' + p.name, p.price, p.mrp, p.stock, p.unit, p.category]);
    }

    console.log('Successfully seeded products!');
  } catch (err) {
    console.error('Error seeding products:', err);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
