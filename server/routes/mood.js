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

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existingMood = await Mood.findOne({
      user: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existingMood) {
      // Check if already updated today
      if (existingMood.isUpdated) {
        return res.status(400).json({ 
          message: "You have already updated today's mood. You can only update once per day." 
        });
      }

      existingMood.mood = mood;
      existingMood.visibility = visibility || existingMood.visibility;
      existingMood.isUpdated = true; // Mark as updated
      await existingMood.save();

      return res.json({
        message: "Mood updated successfully",
        mood: existingMood,
      });
    }

    // Creating new mood for today
    const newMood = await Mood.create({
      user: req.user._id,
      mood,
      visibility: visibility || "private",
      date: new Date(),
      isUpdated: false, // Fresh entry, can be updated once
    });

    res.status(201).json({
      message: "Mood added successfully",
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
