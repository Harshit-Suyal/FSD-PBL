import express from "express";
import { getAdminStats, adminDeleteGig, adminGetAllGigs } from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/stats", getAdminStats);
router.get("/gigs", adminGetAllGigs);
router.delete("/gigs/:id", adminDeleteGig);

export default router;
