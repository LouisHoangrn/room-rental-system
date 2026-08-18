const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "../backend/.env") });

async function run() {
  console.log("Connecting to MySQL...");
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true, // Allow running multiple queries at once
  });

  try {
    const schemaPath = path.join(__dirname, "schema.sql");
    const seedPath = path.join(__dirname, "seed.sql");

    console.log("Running schema.sql...");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    await connection.query(schemaSql);
    console.log("Schema imported successfully.");

    console.log("Running seed.sql...");
    const seedSql = fs.readFileSync(seedPath, "utf8");
    await connection.query(seedSql);
    console.log("Seed data imported successfully.");
  } catch (error) {
    console.error("Error executing SQL scripts:");
    console.error(error.message);
  } finally {
    await connection.end();
    console.log("Disconnected.");
  }
}

run();
