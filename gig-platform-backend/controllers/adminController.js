import User from "../models/User.js";
import Gig from "../models/Gig.js";
import Application from "../models/Application.js";
import Review from "../models/Review.js";

// @desc    Get platform-wide statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res) => {
    try {
        const [totalUsers, totalGigs, totalApplications, totalReviews] = await Promise.all([
            User.countDocuments(),
            Gig.countDocuments(),
            Application.countDocuments(),
            Review.countDocuments(),
        ]);

        const usersByRole = await User.aggregate([
            { $group: { _id: "$role", count: { $sum: 1 } } },
        ]);

        const gigsByStatus = await Gig.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);

        const applicationsByStatus = await Application.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);

        res.json({
            totalUsers,
            totalGigs,
            totalApplications,
            totalReviews,
            usersByRole,
            gigsByStatus,
            applicationsByStatus,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin delete any gig
// @route   DELETE /api/admin/gigs/:id
// @access  Private/Admin
export const adminDeleteGig = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id);
        if (!gig) {
            return res.status(404).json({ message: "Gig not found" });
        }

        const hasApplications = await Application.exists({ gig: gig._id });
        if (hasApplications && ["pending", "accepted", "in-progress"].includes(gig.status)) {
            return res
                .status(400)
                .json({ message: "Cannot delete active jobs with applications" });
        }

        await gig.deleteOne();
        res.json({ message: "Gig removed by admin" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const adminGetAllGigs = async (req, res) => {
    try {
        const gigs = await Gig.find({})
            .populate("client", "name email")
            .populate("assignedWorkers", "name email")
            .sort({ createdAt: -1 });

        res.json(gigs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
