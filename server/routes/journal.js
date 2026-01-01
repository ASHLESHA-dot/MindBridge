import express from "express";
import Journal from "../models/Journal.js";
import Circle from "../models/Circle.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route POST /api/journals
 * @desc  Create a new journal entry
 * @access Protected
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, body, visibility, sharedCircles } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: "Title and body required" });
    }

    // Validate visibility
    if (visibility && !["private", "circles", "public"].includes(visibility)) {
      return res.status(400).json({ message: "Invalid visibility option" });
    }

    // If visibility is circles, validate that circles are provided
    if (visibility === "circles" && (!sharedCircles || sharedCircles.length === 0)) {
      return res.status(400).json({ message: "Please select at least one circle to share with" });
    }

    // Validate that user is a member of the circles they're sharing to
    if (visibility === "circles" && sharedCircles && sharedCircles.length > 0) {
      const circles = await Circle.find({ _id: { $in: sharedCircles } });
      
      for (const circle of circles) {
        if (!circle.members.includes(req.user._id)) {
          return res.status(403).json({ 
            message: `You must be a member of ${circle.name} to share with it` 
          });
        }
      }
    }

    const journal = await Journal.create({
      user: req.user._id,
      title,
      body,
      visibility: visibility || "private",
      sharedCircles: visibility === "circles" ? sharedCircles : [],
    });

    await journal.populate("sharedCircles", "name");

    res.status(201).json(journal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route GET /api/journals
 * @desc  Get user's own journal entries
 * @access Protected
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const journals = await Journal.find({ user: req.user._id })
      .populate("sharedCircles", "name")
      .sort({ date: -1 });

    res.json(journals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route GET /api/journals/public
 * @desc  Get all public journal entries
 * @access Protected
 */
router.get("/public", authMiddleware, async (req, res) => {
  try {
    const journals = await Journal.find({ visibility: "public" })
      .populate("user", "username displayName profilePicture")
      .populate("sharedCircles", "name")
      .sort({ date: -1 })
      .limit(20);

    res.json(journals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route GET /api/journals/circle/:circleId
 * @desc  Get journal entries shared with a specific circle
 * @access Protected (circle members only)
 */
router.get("/circle/:circleId", authMiddleware, async (req, res) => {
  try {
    const { circleId } = req.params;

    // Check if user is a member of the circle
    const circle = await Circle.findById(circleId);
    if (!circle) {
      return res.status(404).json({ message: "Circle not found" });
    }

    if (!circle.members.includes(req.user._id)) {
      return res.status(403).json({ message: "You must be a member of this circle" });
    }

    // Get journals shared with this circle
    const journals = await Journal.find({
      visibility: "circles",
      sharedCircles: circleId,
    })
      .populate("user", "username displayName profilePicture")
      .populate("sharedCircles", "name")
      .sort({ date: -1 });

    res.json(journals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route GET /api/journals/:id
 * @desc  Get a single journal entry
 * @access Protected
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id)
      .populate("user", "username displayName profilePicture")
      .populate("sharedCircles", "name");

    if (!journal) {
      return res.status(404).json({ message: "Journal not found" });
    }

    // Check if user has permission to view
    const isOwner = journal.user._id.toString() === req.user._id.toString();
    const isPublic = journal.visibility === "public";
    const isSharedWithUserCircle = 
      journal.visibility === "circles" && 
      journal.sharedCircles.some(async (circleId) => {
        const circle = await Circle.findById(circleId);
        return circle && circle.members.includes(req.user._id);
      });

    if (!isOwner && !isPublic && !isSharedWithUserCircle) {
      return res.status(403).json({ message: "You don't have permission to view this journal" });
    }

    res.json(journal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route PUT /api/journals/:id
 * @desc  Update a journal entry
 * @access Protected (owner only)
 */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, body, visibility, sharedCircles } = req.body;

    const journal = await Journal.findById(req.params.id);
    
    if (!journal) {
      return res.status(404).json({ message: "Journal not found" });
    }

    // Check if user is the owner
    if (journal.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own journals" });
    }

    // Validate visibility
    if (visibility && !["private", "circles", "public"].includes(visibility)) {
      return res.status(400).json({ message: "Invalid visibility option" });
    }

    // Update fields
    if (title) journal.title = title;
    if (body) journal.body = body;
    if (visibility) journal.visibility = visibility;
    
    // Update shared circles
    if (visibility === "circles") {
      if (!sharedCircles || sharedCircles.length === 0) {
        return res.status(400).json({ message: "Please select at least one circle" });
      }
      journal.sharedCircles = sharedCircles;
    } else {
      journal.sharedCircles = [];
    }

    await journal.save();
    await journal.populate("sharedCircles", "name");

    res.json(journal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route DELETE /api/journals/:id
 * @desc  Delete a journal entry
 * @access Protected (owner only)
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);
    
    if (!journal) {
      return res.status(404).json({ message: "Journal not found" });
    }

    // Check if user is the owner
    if (journal.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own journals" });
    }

    await Journal.findByIdAndDelete(req.params.id);

    res.json({ message: "Journal deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;