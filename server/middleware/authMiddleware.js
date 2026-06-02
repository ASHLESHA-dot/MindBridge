import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const now = new Date();
    const isMuted = user.moderation?.mutedUntil && new Date(user.moderation.mutedUntil) > now;
    const isRestricted = user.moderation?.restrictedUntil && new Date(user.moderation.restrictedUntil) > now;
    const isSuspended = user.moderation?.status === "suspended" && (!user.moderation.suspendedUntil || new Date(user.moderation.suspendedUntil) > now);
    const isBanned = user.moderation?.status === "banned";

    if (isSuspended || isBanned) {
      return res.status(403).json({ message: "Your account is currently restricted by moderation." });
    }

    req.user = user; 
    req.userModeration = {
      isMuted,
      isRestricted,
      mutedUntil: user.moderation?.mutedUntil || null,
      restrictedUntil: user.moderation?.restrictedUntil || null,
      violationCount: user.moderation?.violationCount || 0,
    };
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export default authMiddleware;
