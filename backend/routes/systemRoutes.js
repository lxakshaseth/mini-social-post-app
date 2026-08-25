const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { getDatabaseStatus } = require("../config/db");

const router = express.Router();
const startTime = Date.now();

router.get("/diagnostics", async (_req, res) => {
  const memory = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());

  // Upload directory writeability check
  let uploadsOk = false;
  const uploadsDir = path.join(__dirname, "..", "uploads");
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const testFile = path.join(uploadsDir, ".write_test");
    fs.writeFileSync(testFile, "ok");
    fs.unlinkSync(testFile);
    uploadsOk = true;
  } catch (err) {
    uploadsOk = false;
  }

  // Database ping latency check
  let dbLatencyMs = null;
  const isDbConnected = mongoose.connection.readyState === 1;
  if (isDbConnected && mongoose.connection.db) {
    try {
      const pingStart = Date.now();
      await mongoose.connection.db.admin().ping();
      dbLatencyMs = Date.now() - pingStart;
    } catch (err) {
      dbLatencyMs = -1;
    }
  }

  let collectionMetrics = null;
  if (isDbConnected) {
    try {
      const Post = require("../models/Post");
      const User = require("../models/User");
      const [totalUsers, totalPosts, totalPolls] = await Promise.all([
        User.countDocuments().catch(() => 0),
        Post.countDocuments().catch(() => 0),
        Post.countDocuments({ "poll.options.0": { $exists: true } }).catch(() => 0),
      ]);
      collectionMetrics = {
        totalUsers,
        totalPosts,
        totalPolls,
      };
    } catch (_) {}
  }

  const envCheck = {
    hasMongoUri: Boolean(process.env.MONGO_URI),
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || "development",
  };

  const diagnostics = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: uptimeSeconds,
      formatted: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`,
      bootTime: new Date(startTime).toISOString(),
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
    },
    memory: {
      heapUsedMB: +(memory.heapUsed / 1024 / 1024).toFixed(2),
      heapTotalMB: +(memory.heapTotal / 1024 / 1024).toFixed(2),
      rssMB: +(memory.rss / 1024 / 1024).toFixed(2),
    },
    database: {
      ...getDatabaseStatus(),
      readyState: mongoose.connection.readyState,
      latencyMs: dbLatencyMs,
      metrics: collectionMetrics,
    },
    storage: {
      uploadsDirectory: uploadsOk ? "ready & writable" : "error / non-writable",
    },
    environment: envCheck,
  };

  return res.json(diagnostics);
});

module.exports = router;
