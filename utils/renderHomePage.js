const Complaint = require("../models/Complaint");
const User = require("../models/User");

async function renderHomePage(req, res, extraData = {}, filter = {}) {
  const complaints = await Complaint.find(filter)
    .populate("user", "username room_no phone")
    .sort({ createdAt: 1 });

  const data = {
    user: req.user,
    complaints,
    ...extraData,
  };
  return data;
}

module.exports = renderHomePage;
