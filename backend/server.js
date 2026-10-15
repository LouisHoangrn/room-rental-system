/**
 * Room Rental & Roommate Matching System — Main Server
 *
 * Entry point for the Express application.
 * Features:
 * - JWT Authentication with role-based access control
 * - Rate limiting for API endpoints (1000 req/15min, 10 req/15min for auth)
 * - File upload handling for room images and avatars
 * - Centralized error handling with custom error messages
 * - CORS configuration for cross-origin requests
 * - Security headers with Helmet
 * - MySQL connection pooling with promise-based API
 * - Automatic port detection and fallback
 *
 * Endpoints:
 * - GET /api/health - Health check endpoint
 * - All API routes prefixed with /api/
 * - Frontend served statically at /frontend/
 *
 * Environment Variables:
 * - PORT: Server port (default: 5000)
 * - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 * - JWT_SECRET: JWT signing secret
 * - JWT_EXPIRES_IN: Token expiration time
 *
 * @author Hoang Long
 * @version 1.0.0
 * @since 2026
 */

// ── Load environment variables first ───────────────────────────────────
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");

const { testConnection } = require("./src/config/db");
const { errorHandler, notFound } = require("./src/middleware/errorHandler");

// ── Create Express app ─────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ── Global Middleware ──────────────────────────────────────────────────

// Security headers (XSS, clickjacking, MIME sniffing protection)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow serving uploads cross-origin
    contentSecurityPolicy: false, // Tắt CSP để cho phép CDN (AOS, FontAwesome) và inline scripts hoạt động trên Frontend
  }),
);

// CORS — allow all origins during development
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// General API rate limiter — 1000 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút.",
    data: null,
    errors: null,
  },
});
app.use("/api/", apiLimiter);

// Stricter rate limiter for auth endpoints — 10 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Giới hạn thực tế: 10 lần đăng nhập/đăng ký thất bại
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút.",
    data: null,
    errors: null,
  },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Parse JSON request bodies (limit 10MB for image base64 payloads)
app.use(express.json({ limit: "10mb" }));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "src", "uploads")));

// ── Health Check ───────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Room Rental API is running",
    data: {
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    },
    errors: null,
  });
});

// ── Mount Route Modules ────────────────────────────────────────────────
// Each route import is wrapped in try/catch so that a missing route file
// does not crash the entire server. This allows incremental development.

const routeModules = [
  { path: "/api/auth", module: "./src/routes/auth.routes" },
  { path: "/api/rooms", module: "./src/routes/room.routes" },
  { path: "/api/rentals", module: "./src/routes/rental.routes" },
  { path: "/api/contracts", module: "./src/routes/contract.routes" },
  { path: "/api/payments", module: "./src/routes/payment.routes" },
  { path: "/api/roommates", module: "./src/routes/roommate.routes" },
  { path: "/api/notifications", module: "./src/routes/notification.routes" },
  { path: "/api/support", module: "./src/routes/support.routes" },
  { path: "/api/admin", module: "./src/routes/admin.routes" },
  { path: "/api/users", module: "./src/routes/user.routes" },
];

routeModules.forEach(({ path: routePath, module: modulePath }) => {
  try {
    const router = require(modulePath);
    app.use(routePath, router);
    console.log(`✅ Route mounted: ${routePath}`);
  } catch (error) {
    console.warn(`⚠️  Route not loaded: ${routePath} — ${error.message}`);
  }
});

// ── Serve Frontend ─────────────────────────────────────────────────────
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");
if (fs.existsSync(FRONTEND_DIR)) {
  app.use("/frontend", express.static(FRONTEND_DIR));
  app.get("/", (req, res) => res.redirect("/frontend/index.html"));
  console.log(`📁 Serving frontend at /frontend (from ${FRONTEND_DIR})`);
}

// ── Error Handling ─────────────────────────────────────────────────────

// 404 handler for unmatched routes (must be after all valid routes)
app.use(notFound);

// Centralized error handler (must be the very last middleware)
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────────────────
const startServer = async () => {
  try {
    // Test database connectivity before starting
    await testConnection();

    // Try to start the server; if the port is in use, try the next few ports
    let port = parseInt(PORT, 10);
    const maxAttempts = 5;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await new Promise((resolve, reject) => {
          const server = app
            .listen(port)
            .on("listening", () => {
              console.log("════════════════════════════════════════════");
              console.log(`🏠 Room Rental API Server`);
              console.log(`   Port: ${port}`);
              console.log(
                `   Environment: ${process.env.NODE_ENV || "development"}`,
              );
              console.log(`   URL: http://localhost:${port}`);
              console.log(`   Health: http://localhost:${port}/api/health`);
              console.log("════════════════════════════════════════════");
              resolve();
            })
            .on("error", (err) => reject(err));
        });
        break; // started successfully
      } catch (err) {
        if (err.code === "EADDRINUSE") {
          console.warn(`⚠️ Port ${port} in use — trying ${port + 1}`);
          port += 1;
          if (attempt === maxAttempts - 1) {
            console.error(
              `❌ All attempts failed. Please free port ${PORT} or set PORT env var.`,
            );
            process.exit(1);
          }
        } else {
          throw err;
        }
      }
    }
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
