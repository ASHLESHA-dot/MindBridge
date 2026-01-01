import mongoose from "mongoose";

const journalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    visibility: {
      type: String,
      enum: ["private", "circles", "public"],
      default: "private",
    },
    sharedCircles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Circle",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Journal", journalSchema);
