'use strict';
require('dotenv').config();
const { pool } = require('../src/config/db');
const bcrypt = require('bcryptjs');

async function seedDelivery() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🌱 Seeding Delivery Data for testing...');

    // 1. Create a dummy Delivery Partner
    const driverEmail = 'driver@ruralswift.com';
    const pwdHash = await bcrypt.hash('password123', 10);
    const driverRes = await client.query(`
      INSERT INTO users (name, email, phone, password, role) 
      VALUES ('Test Driver', $1, '9999999999', $2, 'delivery')
      ON CONFLICT (email) DO UPDATE SET role = 'delivery'
      RETURNING user_id
    `, [driverEmail, pwdHash]);
    const driverId = driverRes.rows[0].user_id;

    // 2. Ensure we have a seller
    const sellerRes = await client.query(`SELECT user_id FROM seller_profiles LIMIT 1`);
    if (sellerRes.rowCount === 0) throw new Error('No seller profile found. Seed DB first.');
    const sellerId = sellerRes.rows[0].user_id;
    
    // Update seller with mock lat/long if missing
    await client.query(`UPDATE seller_profiles SET latitude = 13.0827, longitude = 80.2707 WHERE user_id = $1`, [sellerId]); // Chennai coords

    // 3. Create dummy products to use for orders
    const productRes = await client.query(`
      INSERT INTO products (seller_id, name, price, stock, is_active, is_approved)
      VALUES ($1, 'Mock Seed Product', 100, 50, true, true)
      RETURNING product_id
    `, [sellerId]);
    const productId = productRes.rows[0].product_id;

    // 4. Create dummy orders around the seller's location
    const orderIds = [];
    for (let i = 1; i <= 3; i++) {
      const otp = '123456';
      const orderRes = await client.query(`
        INSERT INTO orders (user_id, status, total, delivery_address, delivery_otp)
        VALUES ($1, 'pending', 100, 'Mock Village Stop ' || $2, $3)
        RETURNING order_id
      `, [driverId, i, otp]); // Using driver as customer just for mockup
      
      const orderId = orderRes.rows[0].order_id;
      orderIds.push(orderId);

      await client.query(`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES ($1, $2, 1, 100)
      `, [orderId, productId]);
    }

    // Commit the transaction here so deliveryService (which uses pool) can see the driver
    await client.query('COMMIT');

    // 5. Use our new Delivery Service to batch these orders!
    const deliveryService = require('../src/services/delivery.service');
    console.log(`📦 Grouping ${orderIds.length} orders into an optimized Delivery Run...`);
    const run = await deliveryService.createDeliveryRun(driverId, sellerId, orderIds);
    
    console.log('✅ Success! Delivery run created.');
    console.log(`\n==============================================`);
    console.log(`🚀 TEST YOUR DRIVER DASHBOARD:`);
    console.log(`1. Go to http://localhost:4200/login`);
    console.log(`2. Login as the driver:`);
    console.log(`   Email:    driver@ruralswift.com`);
    console.log(`   Password: password123`);
    console.log(`3. Go to http://localhost:4200/delivery-hub`);
    console.log(`4. Click 'View Route' to see the Leaflet Map!`);
    console.log(`==============================================\n`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

seedDelivery();
