import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware/authMiddleware.js";
import { cloudinary , upload } from '../config/cloudinary.js';
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";

const router = express.Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

const toAuthUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  displayName: user.displayName,
  bio: user.bio,
  interests: user.interests,
  profilePicture: user.profilePicture,
});

const generateUniqueUsername = async (base) => {
  const safeBase = (base || "user")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);

  const firstTry = safeBase || "user";
  const exists = await User.findOne({ username: firstTry });
  if (!exists) return firstTry;

  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = crypto.randomBytes(3).toString("hex");
    const candidate = `${firstTry}_${suffix}`.slice(0, 30);
    const taken = await User.findOne({ username: candidate });
    if (!taken) return candidate;
  }

  // last-resort: timestamp-based
  return `${firstTry}_${Date.now().toString(36)}`.slice(0, 30);
};

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

   const token = signToken(user._id);

res.status(201).json({
  message: "User created",
  token,
  user: toAuthUser(user)
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

    const token = signToken(user._id);

res.json({
  message: "Login successful",
  token,
  user: toAuthUser(user)
});

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Google OAuth: client sends Google ID token (credential) -> server verifies -> returns app JWT
router.post("/oauth/google", async (req, res) => {
  try {
    const idToken = req.body?.credential || req.body?.idToken;
    if (!idToken) {
      return res.status(400).json({ message: "Missing Google credential" });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res
        .status(500)
        .json({ message: "Server missing GOOGLE_CLIENT_ID" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;
    const emailVerified = payload?.email_verified;
    const sub = payload?.sub;
    const name = payload?.name;
    const picture = payload?.picture;

    if (!email) {
      return res.status(400).json({ message: "Google account missing email" });
    }
    if (emailVerified === false) {
      return res.status(400).json({ message: "Google email not verified" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const baseUsername = email.split("@")[0];
      const username = await generateUniqueUsername(baseUsername);
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await User.create({
        username,
        email,
        password: hashedPassword,
        authProvider: "google",
        googleSub: sub,
        displayName: name,
        profilePicture: picture || undefined,
      });
    } else {
      // if an existing local account logs in via Google, link it
      let changed = false;
      if (!user.googleSub && sub) {
        user.googleSub = sub;
        changed = true;
      }
      if (user.authProvider === "local") {
        user.authProvider = "google";
        changed = true;
      }
      if (!user.displayName && name) {
        user.displayName = name;
        changed = true;
      }
      if (
        (!user.profilePicture || user.profilePicture.includes("ui-avatars.com")) &&
        picture
      ) {
        user.profilePicture = picture;
        changed = true;
      }
      if (changed) await user.save();
    }

    const token = signToken(user._id);
    res.json({
      message: "Google login successful",
      token,
      user: toAuthUser(user),
    });
  } catch (err) {
    console.error("Google OAuth error:", err);
    res.status(500).json({ message: "Google OAuth failed" });
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
// * @route POST /api/auth/profile-picture
//  * @desc  Upload profile picture
//  * @access Protected
//  */
router.post("/profile-picture", authMiddleware, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(req.user._id);

    // Delete old profile picture from Cloudinary if exists
    if (user.profilePicturePublicId) {
      await cloudinary.uploader.destroy(user.profilePicturePublicId);
    }

    // Update user with new profile picture
    user.profilePicture = req.file.path;
    user.profilePicturePublicId = req.file.filename;
    await user.save();

    res.json({
      message: "Profile picture updated successfully",
      profilePicture: user.profilePicture
    });
  } catch (err) {
    console.error("Error uploading profile picture:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route DELETE /api/auth/profile-picture
 * @desc  Delete profile picture (reset to default)
 * @access Protected
 */
router.delete("/profile-picture", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Delete from Cloudinary if exists
    if (user.profilePicturePublicId) {
      await cloudinary.uploader.destroy(user.profilePicturePublicId);
    }

    // Reset to default avatar
    user.profilePicture = `https://ui-avatars.com/api/?name=${user.username}&background=random`;
    user.profilePicturePublicId = null;
    await user.save();

    res.json({
      message: "Profile picture deleted successfully",
      profilePicture: user.profilePicture
    });} catch (err) {
    res.status(500).json({ message: err.message });
  }
});
export default router;
