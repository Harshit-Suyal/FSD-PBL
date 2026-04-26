import express from "express";
import {
  createPaymentOrder,
  getMyPayments,
  markTestPaymentPaid,
  verifyRazorpayPayment,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, getMyPayments);
router.post("/create-order", protect, createPaymentOrder);
router.post("/verify", protect, verifyRazorpayPayment);
router.post("/test-mark-paid", protect, markTestPaymentPaid);

export default router;