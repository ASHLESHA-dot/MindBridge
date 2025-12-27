import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import authMiddleware from "./middleware/authMiddleware.js";
import circleRoutes from "./routes/circle.js";
import postRoutes from "./routes/post.js";
import commentRoutes from "./routes/comment.js";
import moodRoutes from "./routes/mood.js";
dotenv.config();

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "You accessed a protected route",
    user: req.user,
  });
});
app.use("/api/circles", circleRoutes);
app.use("/api/posts", postRoutes);

app.use("/api/comments", commentRoutes);
app.use("/api/moods", moodRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(" MongoDB connected");
    app.listen(5000, () => {
      console.log("Server running on http://localhost:5000");
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });




