import express from "express";
import Circle from "../models/Circle.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { uploadCover, cloudinary } from '../config/cloudinary.js';
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
      visibility: visibility || "public",
      creator: req.user._id,
      members: [req.user._id],
      admins: [req.user._id], // Creator is automatically admin
      joinRequests: [],
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
 * @route GET /api/circles/joined
 * @desc  Get all circles the user has joined
 * @access Protected
 */
router.get("/joined", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all circles where the user is a member
    const circles = await Circle.find({
      members: userId
    }).select('_id name description tags coverImage');
    
    res.json(circles);
  } catch (err) {
    console.error("Error fetching joined circles:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route GET /api/circles/:id
 * @desc  Get a single circle by ID
 * @access Protected
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id)
      .populate("creator", "username displayName")
      .populate("members", "username")
      .populate("admins", "username displayName");

    if (!circle) {
      return res.status(404).json({ message: "Circle not found" });
    }
   console.log("Circle admins:", circle.admins); // Debug log
    console.log("Requesting user:", req.user._id); 
    res.json(circle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route POST /api/circles/:id/join
 * @desc  Join a circle (public) or request to join (private)
 * @access Protected
 */
router.post("/:id/join", authMiddleware, async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);

    if (!circle) {
      return res.status(404).json({ message: "Circle not found" });
    }

    // Check if already a member
    if (circle.members.includes(req.user._id)) {
      return res.status(400).json({ message: "Already a member" });
    }

    // Public circle - join instantly
    if (circle.visibility === "public") {
      circle.members.push(req.user._id);
      await circle.save();
      return res.json({ message: "Joined circle successfully" });
    }

    // Private circle - send join request
    if (circle.visibility === "private") {
      // Check if request already sent
      if (circle.joinRequests.includes(req.user._id)) {
        return res.status(400).json({ message: "Join request already sent" });
      }

      circle.joinRequests.push(req.user._id);
      await circle.save();
      return res.json({ message: "Join request sent. Waiting for admin approval." });
    }

    res.status(400).json({ message: "Invalid circle visibility" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route GET /api/circles/:id/requests
 * @desc  Get join requests for a circle (Admin only)
 * @access Protected (Admin)
 */
router.get("/:id/requests", authMiddleware, async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id)
      .populate("joinRequests", "username displayName email");

    if (!circle) {
      return res.status(404).json({ message: "Circle not found" });
    }

    // Check if user is admin
    if (!circle.admins.some(admin => admin.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Admin access required" });
    }

    res.json(circle.joinRequests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route POST /api/circles/:id/requests/:userId
 * @desc  Approve or reject join request (Admin only)
 * @access Protected (Admin)
 */
router.post("/:id/requests/:userId", authMiddleware, async (req, res) => {
  try {
    const { action } = req.body; // "approve" or "reject"
    const circle = await Circle.findById(req.params.id);

    if (!circle) {
      return res.status(404).json({ message: "Circle not found" });
    }

    // Check if user is admin
    if (!circle.admins.some(admin => admin.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Remove from join requests
    circle.joinRequests = circle.joinRequests.filter(
      id => id.toString() !== req.params.userId
    );

    // If approved, add to members
    if (action === "approve") {
      if (!circle.members.includes(req.params.userId)) {
        circle.members.push(req.params.userId);
      }
    }

    await circle.save();
    res.json({ 
      message: action === "approve" ? "Join request approved" : "Join request rejected" 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route DELETE /api/circles/:id/members/:userId
 * @desc  Remove member from circle (Admin only)
 * @access Protected (Admin)
 */
router.delete("/:id/members/:userId", authMiddleware, async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);

    if (!circle) {
      return res.status(404).json({ message: "Circle not found" });
    }

    // Check if user is admin
    if (!circle.admins.some(admin => admin.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Can't remove creator
    if (circle.creator.toString() === req.params.userId) {
      return res.status(400).json({ message: "Cannot remove circle creator" });
    }

    circle.members = circle.members.filter(
      id => id.toString() !== req.params.userId
    );

    circle.admins = circle.admins.filter(
      id => id.toString() !== req.params.userId
    );

    await circle.save();
    res.json({ message: "Member removed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route PUT /api/circles/:id
 * @desc  Update circle details (Admin only)
 * @access Protected (Admin)
 */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { name, description, tags, visibility } = req.body;
    const circle = await Circle.findById(req.params.id);

    if (!circle) {
      return res.status(404).json({ message: "Circle not found" });
    }

    // Check if user is admin
    if (!circle.admins.some(admin => admin.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Admin access required" });
    }

    if (name) circle.name = name;
    if (description !== undefined) circle.description = description;
    if (tags) circle.tags = tags;
    if (visibility) circle.visibility = visibility;

    await circle.save();
    res.json({ message: "Circle updated successfully", circle });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
/**
 * @route POST /api/circles/:id/cover-image
 * @desc  Upload circle cover image (Admin only)
 * @access Protected (Admin)
 */
router.post('/:id/cover-image', authMiddleware, uploadCover.single('coverImage'), async (req, res) => {
  try {
    const { id } = req.params;
    const circle = await Circle.findById(id);

    if (!circle) {
      return res.status(404).json({ message: 'Circle not found' });
    }

    // Check if user is admin
    const isAdmin = circle.admins.some(adminId => adminId.toString() === req.user._id.toString());
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can update circle cover image' });
    }

    // Delete old cover image from Cloudinary if exists
    if (circle.coverImagePublicId) {
      try {
        await cloudinary.uploader.destroy(circle.coverImagePublicId);
      } catch (err) {
        console.error('Error deleting old cover image:', err);
      }
    }

    // Update circle with new cover image
    circle.coverImage = req.file.path;
    circle.coverImagePublicId = req.file.filename;
    await circle.save();

    res.json({
      message: 'Cover image updated successfully',
      coverImage: circle.coverImage
    });
  } catch (error) {
    console.error('Error uploading cover image:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route DELETE /api/circles/:id/cover-image
 * @desc  Delete circle cover image (Admin only)
 * @access Protected (Admin)
 */
router.delete('/:id/cover-image', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const circle = await Circle.findById(id);

    if (!circle) {
      return res.status(404).json({ message: 'Circle not found' });
    }

    // Check if user is admin
    const isAdmin = circle.admins.some(adminId => adminId.toString() === req.user._id.toString());
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can delete circle cover image' });
    }

    // Delete from Cloudinary
    if (circle.coverImagePublicId) {
      try {
        await cloudinary.uploader.destroy(circle.coverImagePublicId);
      } catch (err) {
        console.error('Error deleting cover image:', err);
      }
    }

    // Remove from database
    circle.coverImage = undefined;
    circle.coverImagePublicId = undefined;
    await circle.save();

    res.json({
      message: 'Cover image deleted successfully',
      coverImage: null
    });
  } catch (error) {
    console.error('Error deleting cover image:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/circles/:id/promote/:userId
 * @desc  Promote member to admin (Admin only)
 * @access Protected (Admin)
 */
router.post("/:id/promote/:userId", authMiddleware, async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);

    if (!circle) {
      return res.status(404).json({ message: "Circle not found" });
    }

    // Check if user is admin
    if (!circle.admins.some(admin => admin.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Check if target user is a member
    if (!circle.members.some(member => member.toString() === req.params.userId)) {
      return res.status(400).json({ message: "User is not a member of this circle" });
    }

    // Check if already an admin
    if (circle.admins.some(admin => admin.toString() === req.params.userId)) {
      return res.status(400).json({ message: "User is already an admin" });
    }

    // Promote to admin
    circle.admins.push(req.params.userId);
    await circle.save();

    res.json({ 
      message: "User promoted to admin successfully",
      circle 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route DELETE /api/circles/:id/demote/:userId
 * @desc  Demote admin to regular member (Admin only)
 * @access Protected (Admin)
 */
router.delete("/:id/demote/:userId", authMiddleware, async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);

    if (!circle) {
      return res.status(404).json({ message: "Circle not found" });
    }

    // Check if user is admin
    if (!circle.admins.some(admin => admin.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Can't demote the creator
    if (circle.creator.toString() === req.params.userId) {
      return res.status(400).json({ message: "Cannot demote the circle creator" });
    }

    // Can't demote yourself if you're the only admin
    if (circle.admins.length === 1 && circle.admins[0].toString() === req.params.userId) {
      return res.status(400).json({ message: "Cannot demote the only admin" });
    }

    // Remove from admins
    circle.admins = circle.admins.filter(
      admin => admin.toString() !== req.params.userId
    );
    await circle.save();

    res.json({ 
      message: "Admin demoted to member successfully",
      circle 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
export default router;