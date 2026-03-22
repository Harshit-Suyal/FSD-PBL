import mongoose from "mongoose";
import { WORK_TYPES } from "../constants/gigMeta.js";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["worker", "client", "admin"],
            default: "worker",
        },
        bio: {
            type: String,
            default: "",
        },
        skills: {
            type: [String],
            default: [],
        },
        location: {
            type: String,
            default: "",
        },
        phone: {
            type: String,
            default: "",
            trim: true,
        },
        workType: {
            type: String,
            enum: WORK_TYPES,
            default: "Freelancer",
        },
        avatar: {
            type: String,
            default: "",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;