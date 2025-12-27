import express from "express";
import Mood from "../models/Mood.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route POST /api/moods
 * @desc  Add or update today's mood
 * @access Protected
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { mood, visibility } = req.body;

    if (!mood) {
      return res.status(400).json({ message: "Mood is required" });
    }

    // Normalize date to start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingMood = await Mood.findOne({
      user: req.user._id,
      date: today,
    });

    if (existingMood) {
      existingMood.mood = mood;
      existingMood.visibility = visibility || existingMood.visibility;
      await existingMood.save();

      return res.json({
        message: "Mood updated",
        mood: existingMood,
      });
    }

    const newMood = await Mood.create({
      user: req.user._id,
      mood,
      visibility,
      date: today,
    });

    res.status(201).json({
      message: "Mood added",
      mood: newMood,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route GET /api/moods
 * @desc  Get mood history of logged-in user
 * @access Protected
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const moods = await Mood.find({ user: req.user._id }).sort({
      date: -1,
    });

    res.json(moods);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
