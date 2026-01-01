import mongoose from "mongoose";

const moodSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mood: {
      type: String,
      enum: ["good", "neutral", "bad" , "not_added"],
      required: true,
    },
    visibility: {
      type: String,
      enum: ["private", "circles", "public"],
    },
    circles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Circle" }],
    date: {
      type: Date,
      required: true,
    },
    isUpdated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

moodSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model("Mood", moodSchema);