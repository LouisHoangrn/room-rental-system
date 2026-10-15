/**
 * Database Configuration
 *
 * Creates a MySQL2 connection pool with promise-based API.
 * Features:
 * - Connection pooling with 10 max connections
 * - Automatic connection retry with queue
 * - UTF8MB4 charset for full Unicode support
 * - Timezone set to UTC (+00:00)
 * - Keep-alive enabled for persistent connections
 *
 * Environment Variables:
 * - DB_HOST: Database host (default: localhost)
 * - DB_PORT: Database port (default: 3306)
 * - DB_USER: Database username (default: root)
 * - DB_PASSWORD: Database password
 * - DB_NAME: Database name (default: room_rental_db)
 *
 * Usage:
 * const { pool, testConnection } = require('./config/db');
 *
 * // Query example
 * const [results] = await pool.query('SELECT * FROM Users WHERE id = ?', [id]);
 *
 * @author Hoang Long
 * @version 1.0.0
 * @since 2026
 */

const mysql = require("mysql2");
require("dotenv").config();

// Create the connection pool with sensible defaults
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "room_rental_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Timezone and charset settings
  timezone: "+00:00",
  charset: "utf8mb4",
});

// Export the promise-wrapped pool for async/await usage
const promisePool = pool.promise();

/**
 * Test the database connection.
 * Logs success or failure to the console.
 *
 * @returns {Promise<boolean>} true if connected, false otherwise
 */
const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log("✅ Database connected successfully");
    console.log(
      `   Host: ${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 3306}`,
    );
    console.log(`   Database: ${process.env.DB_NAME || "room_rental_db"}`);
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error(
      `   Host: ${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 3306}`,
    );
    console.error(`   Database: ${process.env.DB_NAME || "room_rental_db"}`);
    return false;
  }
};

module.exports = { pool: promisePool, testConnection };
