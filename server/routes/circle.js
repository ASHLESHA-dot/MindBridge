import express from "express";
import Circle from "../models/Circle.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route POST /api/circles
 * @desc  Create a new circle
 * @access Protected
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, description, tags, visibility } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Circle name required" });
    }

    const circle = await Circle.create({
      name,
      description,
      tags,
      visibility,
      creator: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json(circle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route GET /api/circles
 * @desc  Get all circles
 * @access Public
 */
router.get("/", async (req, res) => {
  try {
    const circles = await Circle.find()
      .populate("creator", "username displayName")
      .populate("members", "username");

    res.json(circles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route POST /api/circles/:id/join
 * @desc  Join a circle
 * @access Protected
 */
router.post("/:id/join", authMiddleware, async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);

    if (!circle) {
      return res.status(404).json({ message: "Circle not found" });
    }

    if (circle.members.includes(req.user._id)) {
      return res.status(400).json({ message: "Already a member" });
    }

    if (circle.visibility === "private") {
      return res.status(403).json({ message: "Private circle" });
    }

    circle.members.push(req.user._id);
    await circle.save();

    res.json({ message: "Joined circle successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
