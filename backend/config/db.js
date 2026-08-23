const mongoose = require("mongoose");

const DB_RETRY_DELAY_MS = Number(process.env.DB_RETRY_DELAY_MS || 15000);
const DB_CONNECT_TIMEOUT_MS = Number(process.env.DB_CONNECT_TIMEOUT_MS || 5000);

let reconnectTimer = null;
let isConnecting = false;
let lastErrorMessage = "";
let connectionEstablishedAt = null;

mongoose.set("bufferCommands", false);

function getStateLabel() {
  const labels = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return labels[mongoose.connection.readyState] || "unknown";
}

function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

async function pingDatabase() {
  if (!isDatabaseReady()) return false;
  try {
    const adminDb = mongoose.connection.db.admin();
    await adminDb.ping();
    return true;
  } catch {
    return false;
  }
}

function getDatabaseStatus() {
  return {
    ready: isDatabaseReady(),
    state: getStateLabel(),
    retrying: Boolean(reconnectTimer) || isConnecting,
    error: lastErrorMessage || null,
    connectedSince: connectionEstablishedAt,
    uptimeSeconds: connectionEstablishedAt ? Math.round((Date.now() - connectionEstablishedAt) / 1000) : 0,
  };
}

function scheduleReconnect() {
  if (reconnectTimer) {
    return;
  }

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectDB();
  }, DB_RETRY_DELAY_MS);

  if (typeof reconnectTimer.unref === "function") {
    reconnectTimer.unref();
  }
}

async function connectDB() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    lastErrorMessage = "MONGO_URI is missing from the environment.";
    console.error(lastErrorMessage);
    return false;
  }

  if (isDatabaseReady() || isConnecting) {
    return isDatabaseReady();
  }

  isConnecting = true;

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: DB_CONNECT_TIMEOUT_MS,
    });

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    lastErrorMessage = "";
    connectionEstablishedAt = Date.now();
    console.log("MongoDB connected successfully.");
    return true;
  } catch (error) {
    lastErrorMessage = error.message;
    console.error(
      `MongoDB unavailable. Retrying in ${Math.round(DB_RETRY_DELAY_MS / 1000)}s: ${error.message}`
    );
    scheduleReconnect();
    return false;
  } finally {
    isConnecting = false;
  }
}

mongoose.connection.on("disconnected", () => {
  connectionEstablishedAt = null;
  if (process.env.MONGO_URI) {
    console.warn("MongoDB disconnected. Reconnecting in the background.");
    scheduleReconnect();
  }
});

mongoose.connection.on("error", (error) => {
  lastErrorMessage = error.message;
});

module.exports = {
  connectDB,
  getDatabaseStatus,
  isDatabaseReady,
  pingDatabase,
};
