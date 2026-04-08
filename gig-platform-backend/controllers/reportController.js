import Report from "../models/Report.js";
import Gig from "../models/Gig.js";
import User from "../models/User.js";
import Review from "../models/Review.js";

// @desc    Create a report/complaint
// @route   POST /api/reports
// @access  Private
export const createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, description } = req.body;

    if (!targetType || !targetId || !reason) {
      return res
        .status(400)
        .json({ message: "targetType, targetId, and reason are required" });
    }

    if (!["gig", "user", "review"].includes(targetType)) {
      return res.status(400).json({ message: "Invalid targetType" });
    }

    const reportPayload = {
      reporter: req.user._id,
      targetType,
      reason,
      description: description || "",
    };

    if (targetType === "gig") {
      const gig = await Gig.findById(targetId);
      if (!gig) return res.status(404).json({ message: "Target gig not found" });
      reportPayload.targetGig = targetId;
    }

    if (targetType === "user") {
      const user = await User.findById(targetId);
      if (!user) return res.status(404).json({ message: "Target user not found" });
      reportPayload.targetUser = targetId;
    }

    if (targetType === "review") {
      const review = await Review.findById(targetId);
      if (!review) return res.status(404).json({ message: "Target review not found" });
      reportPayload.targetReview = targetId;
    }

    const report = await Report.create(reportPayload);

    const populated = await Report.findById(report._id)
      .populate("reporter", "name email role")
      .populate("targetGig", "title status")
      .populate("targetUser", "name email role isActive")
      .populate("targetReview", "rating comment");

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};