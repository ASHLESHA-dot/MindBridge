import express from "express";
import Post from "../models/Post.js";
import Circle from "../models/Circle.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route POST /api/posts/:circleId
 * @desc  Create a post inside a circle
 * @access Protected (members only)
 */
router.post("/:circleId", authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;
    const { circleId } = req.params;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content required" });
    }

    const circle = await Circle.findById(circleId);
    if (!circle) {
      return res.status(404).json({ message: "Circle not found" });
    }

    // 🔒 member check
    if (!circle.members.includes(req.user._id)) {
      return res.status(403).json({ message: "Not a circle member" });
    }

    const post = await Post.create({
      title,
      content,
      author: req.user._id,
      circle: circleId,
    });

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route GET /api/posts/:circleId
 * @desc  Get posts for a circle
 * @access Protected (members only)
 */
router.get("/:circleId", authMiddleware, async (req, res) => {
  try {
    const { circleId } = req.params;

    const circle = await Circle.findById(circleId);
    if (!circle) {
      return res.status(404).json({ message: "Circle not found" });
    }

    if (!circle.members.includes(req.user._id)) {
      return res.status(403).json({ message: "Not a circle member" });
    }

    const posts = await Post.find({ circle: circleId })
      .populate("author", "username displayName")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
