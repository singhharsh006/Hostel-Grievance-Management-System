const express = require("express");
const router = express.Router();

const renderHomePage = require("../utils/renderHomePage");
const loginAdminUser = require("../controllers/loginAdminUser");
const Complaint = require("../models/Complaint");
const upload = require("../middleware/upload");
const mail = require("../utils/mailer");

const authMiddleareAdmin = require("../middleware/authAdmin");

router.get("/login", (req, res) => {
  res.render("adminLogin");
});

router.post("/login", async (req, res) => {
  try {
    const token = await loginAdminUser(req.body);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });
    return res.redirect("/admin/home");
  } catch (err) {
    console.error("Error while admin login:", err);
    return res.render("adminLogin", { message: "Invalid username or password" });
  }
});

// ===== Admin Dashboard =====
router.get("/home", authMiddleareAdmin, async (req, res) => {
  try {
    const filter = { hostel_no: req.user.hostel_no };
    const data = await renderHomePage(req, res, {}, filter);
    return res.render("adminHome", data);
  } catch (err) {
    console.error("Error loading admin dashboard:", err);
    return res.redirect("/admin/login");
  }
});

// ===== Update / Resolve Complaint =====
// Works with your existing "Resolve" button (no fields = resolved).
// Optional form fields: status, priority, adminNote, and file "resolutionImage".
router.post("/resolve/:id", authMiddleareAdmin, upload.single("resolutionImage"), async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate(
      "user",
      "username email hostel_no room_no"
    );
    if (!complaint) return res.redirect("/admin/home");

    const oldStatus = complaint.status;
    const { status, priority, adminNote } = req.body;

    complaint.status = ["resolved", "not resolved", "in progress"].includes(status) ? status : "resolved";
    if (["Urgent", "High", "Medium", "Low"].includes(priority) && priority !== complaint.priority) {
      complaint.priority = priority;
      complaint.prioritySource = "admin";
    }
    if (typeof adminNote === "string" && adminNote.trim()) complaint.adminNote = adminNote.trim();
    if (req.file) complaint.resolutionImage = upload.publicPath(req.file);
    if (complaint.status === "resolved" && !complaint.resolvedAt) complaint.resolvedAt = new Date();

    await complaint.save();

    // Status badla to email: resolved => student + admin dono ko, baaki status => student ko
    if (oldStatus !== complaint.status && complaint.user) {
      if (complaint.status === "resolved") {
        mail.resolvedNotify(complaint.user, complaint, "admin");
      } else {
        mail.statusChanged(complaint.user, complaint);
      }
    }

    const filter = { hostel_no: req.user.hostel_no };
    const message = req.uploadError
      ? "Complaint updated, but photo was not saved: " + req.uploadError
      : "Complaint resolved successfully.";
    const data = await renderHomePage(req, res, { message }, filter);
    return res.render("adminHome", data);
  } catch (err) {
    console.error("Error while resolving complaint:", err);
    return res.redirect("/admin/home");
  }
});

// ===== Analytics (scoped to the admin's hostel) =====
router.get("/analytics", authMiddleareAdmin, (req, res) => {
  res.render("analytics", { hostel: req.user.hostel_no || "All hostels", user: req.user });
});

router.get("/analytics/data", authMiddleareAdmin, async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 365);
    const since = new Date(Date.now() - days * 864e5);
    const base = { createdAt: { $gte: since } };
    if (req.user.hostel_no) base.hostel_no = req.user.hostel_no;
    const match = { $match: base };

    const group = (expr) => [match, { $group: { _id: expr, n: { $sum: 1 } } }, { $sort: { n: -1 } }];

    const [byCategory, byStatus, byPriority, trend, resolution, totals] = await Promise.all([
      Complaint.aggregate(group("$category")),
      Complaint.aggregate(group("$status")),
      Complaint.aggregate(group({ $ifNull: ["$priority", "Medium"] })),
      Complaint.aggregate([
        match,
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, n: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Complaint.aggregate([
        match,
        { $match: { status: "resolved", resolvedAt: { $ne: null } } },
        { $group: { _id: "$category", avgHours: { $avg: { $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 36e5] } } } },
      ]),
      Complaint.aggregate([
        match,
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
            open: { $sum: { $cond: [{ $ne: ["$status", "resolved"] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const t = totals[0] || { total: 0, resolved: 0, open: 0 };
    const avg = resolution.length ? resolution.reduce((a, r) => a + r.avgHours, 0) / resolution.length : 0;
    res.json({
      totals: { ...t, resolutionRate: t.total ? Math.round((t.resolved / t.total) * 100) : 0, avgResolutionHours: +avg.toFixed(1) },
      byCategory, byStatus, byPriority, trend, resolution,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Could not load analytics" });
  }
});

module.exports = router;