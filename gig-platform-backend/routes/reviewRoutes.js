import express from "express";
import { addReview, getUserReviews, getGigReviews } from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:gigId", protect, addReview);
router.get("/user/:userId", getUserReviews);
router.get("/gig/:gigId", getGigReviews);

export default router;
