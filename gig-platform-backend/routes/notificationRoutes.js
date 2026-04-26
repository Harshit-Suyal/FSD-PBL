import express from "express";
import {
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getMyNotifications);
router.put("/read-all", protect, markAllNotificationsAsRead);
router.put("/:id/read", protect, markNotificationAsRead);

export default router;