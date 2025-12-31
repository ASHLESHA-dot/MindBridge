import mongoose from "mongoose";

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
