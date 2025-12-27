import express from "express";
import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import Circle from "../models/Circle.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route POST /api/comments/:postId
 * @desc  Add comment to a post
 * @access Protected (circle members only)
 */
router.post("/:postId", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const { postId } = req.params;

    if (!content) {
      return res.status(400).json({ message: "Comment content required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const circle = await Circle.findById(post.circle);
    if (!circle.members.includes(req.user._id)) {
      return res.status(403).json({ message: "Not a circle member" });
    }

    const comment = await Comment.create({
      content,
      author: req.user._id,
      post: postId,
    });

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route GET /api/comments/:postId
 * @desc  Get comments for a post
 * @access Protected (circle members only)
 */
router.get("/:postId", authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const circle = await Circle.findById(post.circle);
    if (!circle.members.includes(req.user._id)) {
      return res.status(403).json({ message: "Not a circle member" });
    }

    const comments = await Comment.find({ post: postId })
      .populate("author", "username displayName")
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
