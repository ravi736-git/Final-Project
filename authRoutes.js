const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

// POST /api/auth/signup
router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must contain at least 6 characters." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = req.app.locals.users.find(user => user.email === normalizedEmail);
    if (existingUser) return res.status(409).json({ message: "An account with this email already exists." });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role: "user"
    };
    req.app.locals.users.push(user);

    return res.status(201).json({
      message: "Account created successfully.",
      token: createToken(user),
      user: publicUser(user)
    });
  } catch (error) { next(error); }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = req.app.locals.users.find(item => item.email === normalizedEmail);
    if (!user) return res.status(401).json({ message: "Invalid email or password." });

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) return res.status(401).json({ message: "Invalid email or password." });

    return res.json({
      message: "Login successful.",
      token: createToken(user),
      user: publicUser(user)
    });
  } catch (error) { next(error); }
});

// POST /api/auth/setup-admin
// Local-development helper. Keep this endpoint private and remove/disable it before deployment.
router.post("/setup-admin", async (req, res, next) => {
  try {
    const { setupKey, name, email, password } = req.body;
    if (!process.env.ADMIN_SETUP_KEY || setupKey !== process.env.ADMIN_SETUP_KEY) {
      return res.status(403).json({ message: "Invalid admin setup key." });
    }
    if (!name || !email || !password || String(password).length < 8) {
      return res.status(400).json({ message: "Name, email and a password of at least 8 characters are required." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (req.app.locals.users.some(user => user.email === normalizedEmail)) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const user = {
      id: `admin-${Date.now()}`,
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 10),
      role: "admin"
    };
    req.app.locals.users.push(user);
    res.status(201).json({ message: "Admin account created.", user: publicUser(user) });
  } catch (error) { next(error); }
});

// GET /api/auth/me
router.get("/me", authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;