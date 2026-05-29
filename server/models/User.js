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
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
