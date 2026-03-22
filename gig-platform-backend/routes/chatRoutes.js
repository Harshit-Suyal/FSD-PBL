import express from "express";
import { getGigMessages, sendGigMessage } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:gigId", protect, getGigMessages);
router.post("/:gigId", protect, sendGigMessage);

export default router;