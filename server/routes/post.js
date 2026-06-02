import express from "express";
import Post from "../models/Post.js";
import Circle from "../models/Circle.js";
import authMiddleware from "../middleware/authMiddleware.js";
import Comment from "../models/Comment.js";
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
      circle: { $in: circleIds },
      archived: { $ne: true },
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

    if (req.userModeration?.isMuted || req.userModeration?.isRestricted) {
      return res.status(403).json({ message: "Your account cannot create posts right now." });
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
      .where({ archived: { $ne: true } })
      .populate("author", "username displayName")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
/**
 * @route PUT /api/posts/:postId
 * @desc  Update a post (author only)
 * @access Protected
 */
router.put("/posts/edit/:postId", authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, content } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own posts" });
    }

    // Update the post
    post.title = title || post.title;
    post.content = content || post.content;
    await post.save();

    // Populate author before returning
    await post.populate("author", "username displayName");

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
/**
 * @route DELETE /api/posts/:postId
 * @desc  Delete a post (author only)
 * @access Protected
 */
router.delete("/posts/delete/:postId", authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own posts" });
    }

    // Delete all comments associated with this post
    await Comment.deleteMany({ post: postId });

    // Delete the post
    await Post.findByIdAndDelete(postId);

    res.json({ message: "Post and associated comments deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;