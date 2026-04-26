import User from "../models/User.js";
import Gig from "../models/Gig.js";
import Application from "../models/Application.js";
import Review from "../models/Review.js";
import Payment from "../models/Payment.js";
import Report from "../models/Report.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";

// @desc    Get platform-wide statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalGigs,
            totalApplications,
            totalReviews,
            totalPayments,
            totalReports,
            openReports,
        ] = await Promise.all([
            User.countDocuments(),
            Gig.countDocuments(),
            Application.countDocuments(),
            Review.countDocuments(),
            Payment.countDocuments(),
            Report.countDocuments(),
            Report.countDocuments({ status: "open" }),
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

        const reportsByStatus = await Report.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);

        res.json({
            totalUsers,
            totalGigs,
            totalApplications,
            totalReviews,
            totalPayments,
            totalReports,
            openReports,
            usersByRole,
            gigsByStatus,
            applicationsByStatus,
            reportsByStatus,
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

        await Promise.all([
            Application.deleteMany({ gig: gig._id }),
            Review.deleteMany({ gig: gig._id }),
            Payment.deleteMany({ gig: gig._id }),
            Message.deleteMany({ gig: gig._id }),
            Notification.deleteMany({ relatedGig: gig._id }),
            Report.deleteMany({ targetGig: gig._id }),
            gig.deleteOne(),
        ]);

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

// @desc    Get all reviews (admin)
// @route   GET /api/admin/reviews
// @access  Private/Admin
export const getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find({})
            .populate("reviewer", "name email role")
            .populate("reviewee", "name email role")
            .populate("gig", "title status")
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete review (admin)
// @route   DELETE /api/admin/reviews/:id
// @access  Private/Admin
export const adminDeleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        await Promise.all([
            Report.deleteMany({ targetReview: review._id }),
            review.deleteOne(),
        ]);

        res.json({ message: "Review deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all reports (admin)
// @route   GET /api/admin/reports
// @access  Private/Admin
export const getAllReports = async (req, res) => {
    try {
        const reports = await Report.find({})
            .populate("reporter", "name email role")
            .populate("targetGig", "title status")
            .populate("targetUser", "name email role isActive")
            .populate("targetReview", "rating comment")
            .populate("resolvedBy", "name email role")
            .sort({ createdAt: -1 });

        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Resolve report (admin)
// @route   PUT /api/admin/reports/:id/resolve
// @access  Private/Admin
export const resolveReport = async (req, res) => {
    try {
        const { actionTaken = "dismissed", adminNote = "" } = req.body;

        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

        if (actionTaken === "remove_gig" && report.targetGig) {
            const gig = await Gig.findById(report.targetGig);
            if (gig) {
                await Promise.all([
                    Application.deleteMany({ gig: gig._id }),
                    Review.deleteMany({ gig: gig._id }),
                    Payment.deleteMany({ gig: gig._id }),
                    Message.deleteMany({ gig: gig._id }),
                    Notification.deleteMany({ relatedGig: gig._id }),
                    Report.deleteMany({ targetGig: gig._id }),
                    gig.deleteOne(),
                ]);
            }
        }

        if (actionTaken === "block_user" && report.targetUser) {
            await User.findByIdAndUpdate(report.targetUser, { isActive: false });
        }

        if (actionTaken === "remove_review" && report.targetReview) {
            await Review.findByIdAndDelete(report.targetReview);
            await Report.deleteMany({ targetReview: report.targetReview });
        }

        report.status = actionTaken === "dismissed" ? "dismissed" : "resolved";
        report.actionTaken = actionTaken;
        report.adminNote = adminNote;
        report.resolvedBy = req.user._id;
        report.resolvedAt = new Date();
        await report.save();

        const populated = await Report.findById(report._id)
            .populate("reporter", "name email role")
            .populate("targetGig", "title status")
            .populate("targetUser", "name email role isActive")
            .populate("targetReview", "rating comment")
            .populate("resolvedBy", "name email role");

        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all payments (admin)
// @route   GET /api/admin/payments
// @access  Private/Admin
export const getAdminPayments = async (req, res) => {
    try {
        const payments = await Payment.find({})
            .populate("gig", "title status")
            .populate("client", "name email")
            .populate("worker", "name email")
            .sort({ createdAt: -1 });

        const totalVolume = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

        res.json({
            totalPayments: payments.length,
            totalVolume,
            payments,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
