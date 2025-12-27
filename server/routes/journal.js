import express from "express";
import Journal from "../models/Journal.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route POST /api/journals
 * @desc  Create journal entry
 * @access Protected
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, body, visibility, sharedCircles } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: "Title and body required" });
    }

    const journal = await Journal.create({
      user: req.user._id,
      title,
      body,
      visibility,
      sharedCircles:
        visibility === "circles" ? sharedCircles || [] : [],
    });

    res.status(201).json(journal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route GET /api/journals
 * @desc  Get logged-in user's journals
 * @access Protected
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const journals = await Journal.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.json(journals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
