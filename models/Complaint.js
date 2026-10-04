const mongoose = require("mongoose");

const PRIORITY_RANK = { Urgent: 4, High: 3, Medium: 2, Low: 1 };

const complaintSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ["water", "network", "mess", "electricity", "washroom", "general"],
    required: true,
  },
  title: { type: String, trim: true },
  hostel_no: { type: String, trim: true, required: true },
  description: { type: String, trim: true },
  status: {
    type: String,
    enum: ["resolved", "not resolved", "in progress"],
    default: "not resolved",
  },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date, default: null },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // ---- NEW: priority ----
  priority: { type: String, enum: Object.keys(PRIORITY_RANK), default: "Medium" },
  priorityRank: { type: Number, default: 2 },
  prioritySource: { type: String, enum: ["auto", "admin"], default: "auto" },

  // ---- NEW: images + admin note ----
  image: { type: String },            // student's photo
  resolutionImage: { type: String },  // admin's "after" photo
  adminNote: { type: String, trim: true },

  // ---- NEW: feedback + reopen ----
  rating: { type: Number, min: 1, max: 5, default: null },
  feedback: { type: String, trim: true },
  reopenCount: { type: Number, default: 0 },
  reopenedAt: { type: Date, default: null },
  reopenReason: { type: String, trim: true },
});

complaintSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "resolved" && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
  this.priorityRank = PRIORITY_RANK[this.priority] || 2;
  next();
});

module.exports = mongoose.model("Complaint", complaintSchema);
module.exports.PRIORITY_RANK = PRIORITY_RANK;
