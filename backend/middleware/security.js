// Security Headers and Lightweight Rate Limiting Middleware

function securityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}

function createRateLimiter({ windowMs = 15 * 60 * 1000, maxRequests = 100, message = "Too many requests, please try again later." } = {}) {
  const requests = new Map();

  // Periodic cleanup of expired records
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of requests.entries()) {
      if (now - data.startTime > windowMs) {
        requests.delete(ip);
      }
    }
  }, windowMs / 2).unref();

  return function rateLimiter(req, res, next) {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const now = Date.now();

    const record = requests.get(ip);

    if (!record) {
      requests.set(ip, { count: 1, startTime: now });
      return next();
    }

    if (now - record.startTime > windowMs) {
      requests.set(ip, { count: 1, startTime: now });
      return next();
    }

    record.count++;

    if (record.count > maxRequests) {
      res.setHeader("Retry-After", Math.ceil((windowMs - (now - record.startTime)) / 1000));
      return res.status(429).json({ message });
    }

    next();
  };
}

function responseTimeMiddleware(req, res, next) {
  const start = process.hrtime();
  const originalWriteHead = res.writeHead;
  res.writeHead = function (...args) {
    const diff = process.hrtime(start);
    const timeInMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    res.setHeader("X-Response-Time", `${timeInMs}ms`);
    return originalWriteHead.apply(this, args);
  };
  next();
}

module.exports = {
  securityHeaders,
  createRateLimiter,
  responseTimeMiddleware,
};
