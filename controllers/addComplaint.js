const Complaint = require("../models/Complaint");
const { detectPriority } = require("../utils/priority");
const mail = require("../utils/mailer");

// user = decoded JWT (id, username, email, hostel_no, room_no ...)
const addComplaint = async (user, complain) => {
  try {
    const newComplain = new Complaint({
      title: complain.title,
      description: complain.description,
      category: complain.category,
      user: user.id,
      hostel_no: user.hostel_no,
      priority: detectPriority(complain),
      prioritySource: "auto",
      image: complain.image,
    });
    await newComplain.save();
    console.log("Complaint saved");

    // emails run in background - they never block or break the request
    mail.complaintRegistered(user, newComplain);
    mail.adminAlert(newComplain, user);
    return true;
  } catch (err) {
    console.error("Error saving complaint:", err);
    return false;
  }
};

module.exports = addComplaint;
