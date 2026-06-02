import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import authMiddleware from "./middleware/authMiddleware.js";
import circleRoutes from "./routes/circle.js";
import moderationRoutes from "./routes/moderation.js";
import postRoutes from "./routes/post.js";
import commentRoutes from "./routes/comment.js";
import moodRoutes from "./routes/mood.js";
import journalRoutes from "./routes/journal.js";
import notificationRoutes from "./routes/notifications.js";

dotenv.config();

const app = express();

/* ---------------- MIDDLEWARE ---------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [
      "https://mind-bridge-gules.vercel.app", // frontend
      "http://localhost:5173",                // local dev
    ],
    credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
  })
);

/* ---------------- ROUTES ---------------- */
app.use("/api/auth", authRoutes);

app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "You accessed a protected route",
    user: req.user,
  });
});

app.use("/api/circles", circleRoutes);
app.use("/api/circles", moderationRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/moods", moodRoutes);
app.use("/api/journals", journalRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api", postRoutes);

/* ---------------- DATABASE + SERVER ---------------- */
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected DB:", mongoose.connection.name);
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });
