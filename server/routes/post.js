import express from "express";
import Post from "../models/Post.js";
import Circle from "../models/Circle.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route GET /api/feed
 * @desc  Get personalized feed from joined circles
 * @access Protected
 */
router.get("/feed", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all circles the user is a member of
    const userCircles = await Circle.find({
      members: userId
    }).select('_id');
    
    if (userCircles.length === 0) {
      return res.json([]); // Return empty array if user hasn't joined any circles
    }
    
    const circleIds = userCircles.map(c => c._id);
    
    // Get posts from those circles, sorted by most recent
    const posts = await Post.find({
      circle: { $in: circleIds }
    })
      .populate('author', 'username displayName profilePicture')
      .populate('circle', 'name')
      .sort({ createdAt: -1 })
      .limit(10); // Get latest 10 posts
    
    res.json(posts);
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/posts/:circleId
 * @desc  Create a post inside a circle
 * @access Protected (members only)
 */
router.post("/posts/:circleId", authMiddleware, async (req, res) => {
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

    // member check
    if (!circle.members.includes(req.user._id)) {
      return res.status(403).json({ message: "Not a circle member" });
    }

    const post = await Post.create({
      title,
      content,
      author: req.user._id,
      circle: circleId,
    });

    // Populate author before returning
    await post.populate("author", "username displayName");

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
router.get("/posts/:circleId", authMiddleware, async (req, res) => {
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