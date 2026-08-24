require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const { connectDB, getDatabaseStatus } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const assistantRoutes = require("./routes/assistantRoutes");
const systemRoutes = require("./routes/systemRoutes");
const sanitizeInput = require("./middleware/sanitize");

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeInput);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    database: getDatabaseStatus(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/system", systemRoutes);

app.use((error, _req, res, _next) => {
  if (error?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "Images must be 5MB or smaller." });
  }

  if (error?.message === "Only image uploads are allowed.") {
    return res.status(400).json({ message: error.message });
  }

  console.error(error);
  return res.status(500).json({ message: "Something went wrong on the server." });
});

function startServer() {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    connectDB();
  });
}

startServer();
