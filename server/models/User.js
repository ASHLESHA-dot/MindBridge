import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    authProvider: {
      type: String,
      enum: ["local", "google", "channeli"],
      default: "local",
    },
    googleSub: { type: String, index: true },
    channeliId: { type: String, index: true },

    displayName: { type: String },
    bio: { type: String, default: "" },
    interests: [{ type: String }],
     profilePicture: {
    type: String,
    default: 'https://ui-avatars.com/api/?name=User&background=random' // Default avatar
  },
  profilePicturePublicId: String,
  moderation: {
    status: {
      type: String,
      enum: ["active", "muted", "suspended", "banned"],
      default: "active",
    },
    mutedUntil: {
      type: Date,
      default: null,
    },
    restrictedUntil: {
      type: Date,
      default: null,
    },
    suspendedUntil: {
      type: Date,
      default: null,
    },
    violationCount: {
      type: Number,
      default: 0,
    },
    lastActionAt: {
      type: Date,
      default: null,
    },
  },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
