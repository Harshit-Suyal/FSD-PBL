import express from "express";
import {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    getUserById,
    getAllUsers,
    toggleUserStatus,
} from "../controllers/userController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.get("/", protect, adminOnly, getAllUsers);
router.get("/:id", getUserById);
router.put("/:id/toggle-status", protect, adminOnly, toggleUserStatus);

export default router;