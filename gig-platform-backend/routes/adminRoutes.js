import express from "express";
import {
	getAdminStats,
	adminDeleteGig,
	adminGetAllGigs,
	getAllReviews,
	adminDeleteReview,
	getAllReports,
	resolveReport,
	getAdminPayments,
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/stats", getAdminStats);
router.get("/gigs", adminGetAllGigs);
router.delete("/gigs/:id", adminDeleteGig);
router.get("/reviews", getAllReviews);
router.delete("/reviews/:id", adminDeleteReview);
router.get("/reports", getAllReports);
router.put("/reports/:id/resolve", resolveReport);
router.get("/payments", getAdminPayments);

export default router;
