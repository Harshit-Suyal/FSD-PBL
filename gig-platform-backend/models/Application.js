import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gig",
      required: true,
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    proposal: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    proposedPrice: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { timestamps: true }
);

applicationSchema.index({ gig: 1, worker: 1 }, { unique: true });

const Application = mongoose.model("Application", applicationSchema);

export default Application;
