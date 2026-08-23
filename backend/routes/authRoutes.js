const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");
const requireDatabase = require("../middleware/requireDatabase");

const router = express.Router();

router.use(requireDatabase);

const avatarPalette = [
  "#1b84ff",
  "#ff7a18",
  "#00a389",
  "#ef476f",
  "#6a4c93",
  "#118ab2",
];

function buildToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function sanitizeHandle(value) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 14);

  return normalized || `member${Math.floor(Math.random() * 9000) + 1000}`;
}

async function createUniqueHandle(seed) {
  const base = sanitizeHandle(seed);
  let handle = base;
  let counter = 1;

  while (await User.exists({ handle })) {
    handle = `${base}${counter}`;
    counter += 1;
  }

  return handle;
}

function pickAvatarColor(seed) {
  const hash = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return avatarPalette[hash % avatarPalette.length];
}

function serializeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    handle: user.handle,
    avatarColor: user.avatarColor,
    bio: user.bio || "",
    location: user.location || "",
    website: user.website || "",
    savedPosts: user.savedPosts || [],
    createdAt: user.createdAt,
  };
}

router.post("/signup", async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const password = (req.body.password || "").trim();

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const handle = await createUniqueHandle(name || email.split("@")[0]);
    const avatarColor = pickAvatarColor(handle);
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      handle,
      password: passwordHash,
      avatarColor,
    });

    return res.status(201).json({
      token: buildToken(user._id),
      user: serializeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to create account right now." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = (req.body.password || "").trim();

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.json({
      token: buildToken(user._id),
      user: serializeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to sign in right now." });
  }
});

router.get("/me", auth, (req, res) => {
  return res.json({ user: serializeUser(req.user) });
});

router.put("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (req.body.name && typeof req.body.name === "string") {
      user.name = req.body.name.trim().slice(0, 60);
    }
    if (req.body.bio !== undefined && typeof req.body.bio === "string") {
      user.bio = req.body.bio.trim().slice(0, 160);
    }
    if (req.body.location !== undefined && typeof req.body.location === "string") {
      user.location = req.body.location.trim().slice(0, 60);
    }
    if (req.body.website !== undefined && typeof req.body.website === "string") {
      user.website = req.body.website.trim().slice(0, 100);
    }
    if (req.body.avatarColor && typeof req.body.avatarColor === "string") {
      user.avatarColor = req.body.avatarColor.trim();
    }

    await user.save();
    return res.json({ user: serializeUser(user), message: "Profile updated successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update profile." });
  }
});

module.exports = router;
