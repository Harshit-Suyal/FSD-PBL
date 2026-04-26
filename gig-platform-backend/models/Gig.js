import mongoose from "mongoose";
import { GIG_STATUSES } from "../constants/gigMeta.js";

const gigSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    budget: {
      type: Number,
      required: true,
      min: 1,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    subcategory: {
      type: String,
      required: true,
      trim: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedWorkers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    requiredWorkers: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: GIG_STATUSES,
      default: "open",
    },
    skills: {
      type: [String],
      default: [],
    },
    deadline: {
      type: Date,
    },
    duration: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      default: "",
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "paid"],
      default: "unpaid",
    },
    paidAt: {
      type: Date,
      default: null,
    },
    workStartedAt: {
      type: Date,
      default: null,
    },
    workEndedAt: {
      type: Date,
      default: null,
    },
    totalWorkHours: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

const Gig = mongoose.model("Gig", gigSchema);

export default Gig;
