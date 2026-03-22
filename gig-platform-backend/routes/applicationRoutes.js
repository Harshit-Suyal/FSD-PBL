import express from "express";
import {
    applyForGig,
    getGigApplications,
    updateApplicationStatus,
    getMyApplications,
    getAllApplications,
} from "../controllers/applicationController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Named routes BEFORE parameterized ones
router.get("/my-applications", protect, getMyApplications);
router.get("/gig/:gigId", protect, getGigApplications);
router.get("/", protect, adminOnly, getAllApplications);

// Parameterized routes
router.post("/:gigId", protect, applyForGig);
router.put("/:id/status", protect, updateApplicationStatus);

export default router;
