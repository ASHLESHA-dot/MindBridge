import mongoose from "mongoose";

const moderationActionSchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      enum: ["approve", "remove", "edit", "archive", "flag", "warn", "mute", "suspend", "restrict", "ban", "remove-user", "close-report", "request-info", "escalate", "merge-report"],
      required: true,
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    targetContentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    circleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Circle",
      required: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      default: null,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("ModerationAction", moderationActionSchema);