import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// // test route
// router.get("/test", (req, res) => {
//   res.json({ message: "Auth route working" });
// });
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });

   const token = jwt.sign(
  { id: user._id },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

res.status(201).json({
  message: "User created",
  token,
  user: {
    id: user._id,
    username: user.username,
    email: user.email
  }
});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
  { id: user._id },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

res.json({
  message: "Login successful",
  token,
  user: {
    id: user._id,
    username: user.username,
    email: user.email
  }
});

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// routes/users.js or auth.js
router.put("/profile", authMiddleware, async (req, res) => {
  console.log("USER IN PROFILE:", req.user); // 👈 add
  try {
    const { displayName, bio, interests } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { displayName, bio, interests },
      { new: true }
    ).select("-password");
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
export default router;
