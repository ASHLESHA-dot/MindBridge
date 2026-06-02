import express from "express";
import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import Circle from "../models/Circle.js";
import authMiddleware from "../middleware/authMiddleware.js";
import Notification from "../models/Notification.js";
const router = express.Router();

/**
 * @route POST /api/comments/:postId
 * @desc  Add comment to a post
 * @access Protected (circle members only)
 */
// In routes/comments.js - Update the POST route
router.post("/:postId", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const { postId } = req.params;

    if (!content) {
      return res.status(400).json({ message: "Comment content required" });
    }

    const post = await Post.findById(postId).populate("author");
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const circle = await Circle.findById(post.circle);
    if (req.userModeration?.isMuted || req.userModeration?.isRestricted) {
      return res.status(403).json({ message: "Your account cannot create comments right now." });
    }
    if (!circle.members.includes(req.user._id)) {
      return res.status(403).json({ message: "Not a circle member" });
    }

    const comment = await Comment.create({
      content,
      author: req.user._id,
      post: postId,
    });

    await comment.populate("author", "username displayName");

    // Create notification for post author (if not commenting on own post)
    if (post.author._id.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: post.author._id,
        type: "comment",
        message: `${req.user.username} commented on your post "${post.title}"`,
        link: `/circles/${circle._id}`, // or specific post link
      });
    }

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

    const comments = await Comment.find({ post: postId, archived: { $ne: true } })
      .populate("author", "username displayName")
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
/**
 * @route DELETE /api/comments/:commentId
 * @desc  Delete a comment (author only)
 * @access Protected
 */
router.delete("/delete/:commentId", authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own comments" });
    }

    await Comment.findByIdAndDelete(commentId);

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
/**
 * @route PUT /api/comments/edit/:commentId
 * @desc  Edit a comment (author only)
 * @access Protected
 */
router.put("/edit/:commentId", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const { commentId } = req.params;

    if (!content) {
      return res.status(400).json({ message: "Comment content required" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own comments" });
    }

    comment.content = content;
    await comment.save();

    await comment.populate("author", "username displayName");

    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
export default router;
