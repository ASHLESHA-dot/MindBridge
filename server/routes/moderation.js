import express from "express";
import Circle from "../models/Circle.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";
import Report from "../models/Report.js";
import ModerationAction from "../models/ModerationAction.js";
import Notification from "../models/Notification.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const REPORT_REASONS = new Set([
  "harassment",
  "bullying",
  "spam",
  "misinformation",
  "nsfw",
  "hate-speech",
  "self-harm",
  "other",
]);

const CONTENT_TYPES = new Set(["post", "comment", "answer", "user"]);

const isCircleAdmin = (circle, userId) =>
  circle.admins?.some((adminId) => adminId.toString() === userId.toString());

const parseDurationToDate = (duration) => {
  if (!duration) return null;

  const normalized = duration.trim().toLowerCase();
  const match = normalized.match(/^(\d+)(h|d|w)$/);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2];
  const now = new Date();

  if (unit === "h") now.setHours(now.getHours() + amount);
  if (unit === "d") now.setDate(now.getDate() + amount);
  if (unit === "w") now.setDate(now.getDate() + amount * 7);

  return now;
};

const buildContentSnapshot = async ({ contentType, contentId, circleId }) => {
  if (contentType === "post") {
    const post = await Post.findById(contentId).populate("author", "username displayName");
    if (!post || post.circle.toString() !== circleId.toString()) {
      throw new Error("Post not found in this circle");
    }

    return {
      contentAuthorId: post.author._id,
      contentSnapshot: {
        title: post.title,
        body: post.content,
        authorName: post.author.displayName || post.author.username || "Unknown",
        extra: "Post",
      },
      targetContent: post,
    };
  }

  if (contentType === "comment") {
    const comment = await Comment.findById(contentId).populate("author", "username displayName").populate({
      path: "post",
      populate: { path: "circle", select: "_id" },
    });

    if (!comment || comment.post?.circle?._id?.toString() !== circleId.toString()) {
      throw new Error("Comment not found in this circle");
    }

    return {
      contentAuthorId: comment.author._id,
      contentSnapshot: {
        title: comment.post?.title || "Comment",
        body: comment.content,
        authorName: comment.author.displayName || comment.author.username || "Unknown",
        extra: "Comment",
      },
      targetContent: comment,
    };
  }

  if (contentType === "user") {
    const reportedUser = await User.findById(contentId).select("username displayName bio interests profilePicture");
    if (!reportedUser) {
      throw new Error("User not found");
    }

    return {
      contentAuthorId: reportedUser._id,
      contentSnapshot: {
        title: reportedUser.displayName || reportedUser.username || "User",
        body: reportedUser.bio || "",
        authorName: reportedUser.displayName || reportedUser.username || "User",
        extra: "Profile",
      },
      targetContent: reportedUser,
    };
  }

  if (contentType === "answer") {
    const contentAuthorId = contentId;
    return {
      contentAuthorId,
      contentSnapshot: {
        title: "Reported answer",
        body: "",
        authorName: "Unknown",
        extra: "Answer",
      },
      targetContent: null,
    };
  }

  throw new Error("Unsupported content type");
};

const sendModerationNotifications = async ({ report, actionLabel, message, reporterMessage }) => {
  const notifications = [];

  notifications.push({
    user: report.contentAuthorId,
    type: "moderation",
    message,
    link: `/circles/${report.circleId}/admin`,
  });

  if (report.reportedBy) {
    notifications.push({
      user: report.reportedBy,
      type: "moderation",
      message: reporterMessage || `Your report for ${report.contentType} was reviewed: ${actionLabel}`,
      link: `/circles/${report.circleId}/admin`,
    });
  }

  await Notification.insertMany(notifications);
};

router.post("/:circleId/reports", authMiddleware, async (req, res) => {
  try {
    const { circleId } = req.params;
    const {
      contentType,
      contentId,
      reason,
      description = "",
      evidenceUrls = [],
      anonymous = false,
      contentAuthorId: explicitAuthorId,
      contentSnapshot: explicitSnapshot,
    } = req.body;

    if (!CONTENT_TYPES.has(contentType)) {
      return res.status(400).json({ message: "Invalid content type" });
    }

    if (!contentId) {
      return res.status(400).json({ message: "Content ID required" });
    }

    if (!REPORT_REASONS.has(reason)) {
      return res.status(400).json({ message: "Invalid report reason" });
    }

    const circle = await Circle.findById(circleId);
    if (!circle) {
      return res.status(404).json({ message: "Circle not found" });
    }

    const isMember = circle.creator?.toString() === req.user._id.toString() ||
      circle.admins?.some((adminId) => adminId.toString() === req.user._id.toString()) ||
      circle.members?.some((memberId) => memberId.toString() === req.user._id.toString());

    if (!isMember) {
      return res.status(403).json({ message: "Circle membership required" });
    }

    let contentAuthorId = explicitAuthorId;
    let contentSnapshot = explicitSnapshot || {};

    if (contentType !== "answer") {
      const details = await buildContentSnapshot({ contentType, contentId, circleId });
      contentAuthorId = details.contentAuthorId;
      contentSnapshot = details.contentSnapshot;
    }

    if (!contentAuthorId) {
      return res.status(400).json({ message: "Could not identify content author" });
    }

    const report = await Report.create({
      circleId,
      contentType,
      contentId,
      contentAuthorId,
      contentSnapshot,
      reportedBy: anonymous ? null : req.user._id,
      anonymous: Boolean(anonymous),
      reason,
      description: description.trim(),
      evidenceUrls: Array.isArray(evidenceUrls) ? evidenceUrls.filter(Boolean) : [],
      status: "pending",
    });

    const admins = (circle.admins || []).filter((adminId) => adminId.toString() !== req.user._id.toString());
    if (admins.length > 0) {
      await Notification.insertMany(
        admins.map((adminId) => ({
          user: adminId,
          type: "moderation",
          message: `New moderation report submitted for ${contentType} in ${circle.name}`,
          link: `/circles/${circleId}/admin`,
        }))
      );
    }

    res.status(201).json(report);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get("/:circleId/reports", authMiddleware, async (req, res) => {
  try {
    const { circleId } = req.params;
    const circle = await Circle.findById(circleId);

    if (!circle) {
      return res.status(404).json({ message: "Circle not found" });
    }

    if (!isCircleAdmin(circle, req.user._id)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const reports = await Report.find({ circleId })
      .sort({ createdAt: -1 })
      .populate("reportedBy", "username displayName")
      .populate("reviewedBy", "username displayName")
      .populate("contentAuthorId", "username displayName");

    const reportCounts = reports.reduce((counts, report) => {
      const key = `${report.contentType}:${report.contentId.toString()}`;
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});

    res.json(
      reports.map((report) => ({
        ...report.toObject(),
        reportCount: reportCounts[`${report.contentType}:${report.contentId.toString()}`] || 1,
        reporterName: report.anonymous ? "Anonymous" : report.reportedBy?.displayName || report.reportedBy?.username || "Unknown",
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:circleId/actions", authMiddleware, async (req, res) => {
  try {
    const { circleId } = req.params;
    const circle = await Circle.findById(circleId);

    if (!circle) {
      return res.status(404).json({ message: "Circle not found" });
    }

    if (!isCircleAdmin(circle, req.user._id)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const actions = await ModerationAction.find({ circleId })
      .sort({ createdAt: -1 })
      .populate("adminId", "username displayName")
      .populate("targetUserId", "username displayName");

    res.json(actions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/:circleId/reports/:reportId/action", authMiddleware, async (req, res) => {
  try {
    const { circleId, reportId } = req.params;
    const { action, reason, duration, severity = "medium", editedTitle, editedContent, editedDescription } = req.body;

    const circle = await Circle.findById(circleId);
    if (!circle) {
      return res.status(404).json({ message: "Circle not found" });
    }

    if (!isCircleAdmin(circle, req.user._id)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const report = await Report.findById(reportId);
    if (!report || report.circleId.toString() !== circleId.toString()) {
      return res.status(404).json({ message: "Report not found" });
    }

    const label = action;
    let targetRecord = null;
    let targetUserId = report.contentAuthorId;

    if (["remove", "archive", "edit"].includes(action)) {
      if (report.contentType === "post") {
        targetRecord = await Post.findById(report.contentId).populate("author", "username displayName");
        if (targetRecord) {
          if (action === "remove") {
            await Comment.deleteMany({ post: targetRecord._id });
            await Post.findByIdAndDelete(targetRecord._id);
          } else if (action === "archive") {
            targetRecord.archived = true;
            await targetRecord.save();
          } else if (action === "edit") {
            if (editedTitle) targetRecord.title = editedTitle;
            if (editedContent) targetRecord.content = editedContent;
            await targetRecord.save();
          }
        }
      }

      if (report.contentType === "comment") {
        targetRecord = await Comment.findById(report.contentId).populate("author", "username displayName");
        if (targetRecord) {
          if (action === "remove") {
            await Comment.findByIdAndDelete(targetRecord._id);
          } else if (action === "archive") {
            targetRecord.archived = true;
            await targetRecord.save();
          } else if (action === "edit") {
            if (editedContent) targetRecord.content = editedContent;
            await targetRecord.save();
          }
        }
      }
    }

    if (["warn", "mute", "suspend", "restrict", "ban", "remove-user"].includes(action)) {
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "Target user not found" });
      }

      targetUser.moderation = targetUser.moderation || {};
      targetUser.moderation.violationCount = (targetUser.moderation.violationCount || 0) + 1;
      targetUser.moderation.lastActionAt = new Date();

      if (action === "mute") {
        targetUser.moderation.status = "muted";
        targetUser.moderation.mutedUntil = parseDurationToDate(duration) || new Date(Date.now() + 24 * 60 * 60 * 1000);
      }

      if (action === "restrict") {
        targetUser.moderation.status = "active";
        targetUser.moderation.restrictedUntil = parseDurationToDate(duration) || new Date(Date.now() + 72 * 60 * 60 * 1000);
      }

      if (action === "suspend") {
        targetUser.moderation.status = "suspended";
        targetUser.moderation.suspendedUntil = parseDurationToDate(duration) || new Date(Date.now() + 72 * 60 * 60 * 1000);
      }

      if (action === "ban") {
        targetUser.moderation.status = "banned";
        targetUser.moderation.suspendedUntil = null;
      }

      if (action === "remove-user") {
        circle.members = circle.members.filter((memberId) => memberId.toString() !== targetUserId.toString());
        circle.admins = circle.admins.filter((adminId) => adminId.toString() !== targetUserId.toString());
        await circle.save();
      }

      await targetUser.save();
    }

    if (["approve", "flag", "close-report", "request-info", "escalate", "merge-report"].includes(action)) {
      // no direct content mutation, just a moderation log change
    }

    report.status = action === "flag" ? "reviewing" : action === "approve" ? "dismissed" : "resolved";
    report.reviewedAt = new Date();
    report.reviewedBy = req.user._id;
    report.action = action === "approve" ? "approved" : action === "remove" ? "removed" : action === "archive" ? "archived" : action === "edit" ? "edited" : action === "warn" ? "warned" : action === "mute" ? "muted" : action === "suspend" ? "suspended" : action === "remove-user" ? "removed-user" : "flagged";
    report.actionReason = reason;

    await report.save();

    await ModerationAction.create({
      actionType: action,
      targetUserId,
      targetContentId: report.contentId,
      circleId,
      adminId: req.user._id,
      reason,
      duration: duration || null,
      severity,
      reportId: report._id,
      metadata: {
        editedTitle,
        editedContent,
        editedDescription,
        contentType: report.contentType,
      },
    });

    const adminName = req.user.displayName || req.user.username || "An admin";
    const authorMessage = `${adminName} reviewed your reported ${report.contentType} and took action: ${action}.`;
    const reporterMessage = `Your report was reviewed: ${action}.`;

    await sendModerationNotifications({
      report,
      actionLabel: action,
      message: authorMessage,
      reporterMessage,
    });

    res.json({ message: "Moderation action saved", report });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
