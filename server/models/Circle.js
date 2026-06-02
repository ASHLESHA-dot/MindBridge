import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    resourceType: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    addedByName: {
      type: String,
      required: true,
      trim: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    viewedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    thumbnail: {
      type: String,
      default: null,
    },
    icon: {
      type: String,
      default: "📄",
    },
  },
  { timestamps: true }
);

const circleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    tags: [String],
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    admins: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    joinRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    resources: [resourceSchema],
    // NEW: Cover image fields
    coverImage: {
      type: String,
      default: null
    },
    coverImagePublicId: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("Circle", circleSchema);
