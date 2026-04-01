const mongoose = require("mongoose");

const DB_RETRY_DELAY_MS = Number(process.env.DB_RETRY_DELAY_MS || 15000);
const DB_CONNECT_TIMEOUT_MS = Number(process.env.DB_CONNECT_TIMEOUT_MS || 5000);

let reconnectTimer = null;
let isConnecting = false;
let lastErrorMessage = "";

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

function getDatabaseStatus() {
  return {
    ready: isDatabaseReady(),
    state: getStateLabel(),
    retrying: Boolean(reconnectTimer) || isConnecting,
    error: lastErrorMessage || null,
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
};
