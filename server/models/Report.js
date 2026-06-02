import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    circleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Circle",
      required: true,
    },
    contentType: {
      type: String,
      enum: ["post", "comment", "answer", "user"],
      required: true,
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    contentAuthorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contentSnapshot: {
      title: { type: String, default: "" },
      body: { type: String, default: "" },
      authorName: { type: String, default: "" },
      extra: { type: String, default: "" },
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    anonymous: {
      type: Boolean,
      default: false,
    },
    reason: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    evidenceUrls: [{ type: String }],
    status: {
      type: String,
      enum: ["pending", "reviewing", "resolved", "dismissed"],
      default: "pending",
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    action: {
      type: String,
      enum: ["approved", "removed", "edited", "archived", "flagged", "warned", "muted", "suspended", "removed-user", null],
      default: null,
    },
    actionReason: {
      type: String,
      default: "",
    },
    appealable: {
      type: Boolean,
      default: true,
    },
    appeal: {
      reason: { type: String, default: "" },
      context: { type: String, default: "" },
      evidenceUrls: [{ type: String }],
      status: {
        type: String,
        enum: ["none", "submitted", "accepted", "rejected"],
        default: "none",
      },
      reviewedAt: { type: Date, default: null },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);