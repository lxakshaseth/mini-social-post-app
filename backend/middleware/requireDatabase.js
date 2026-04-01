const { isDatabaseReady } = require("../config/db");

function requireDatabase(_req, res, next) {
  if (isDatabaseReady()) {
    return next();
  }

  return res.status(503).json({
    message:
      "Database is reconnecting right now. AI support is still available, but account and feed changes are temporarily paused.",
  });
}

module.exports = requireDatabase;
