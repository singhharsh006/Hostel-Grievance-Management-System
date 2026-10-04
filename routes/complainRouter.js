const express = require("express");
const addComplaint = require("../controllers/addComplaint");
const Complaint = require("../models/Complaint");
const renderHomePage = require("../utils/renderHomePage");
const upload = require("../middleware/upload");
const mail = require("../utils/mailer");

const router = express.Router();

router.post("/add", upload.single("image"), async (req, res) => {
  // image problems (too big / wrong type) -> show the form again with a message
  if (req.uploadError) {
    return res.status(400).render("addComplaint", { error: req.uploadError });
  }

  const complain = {
    title: req.body.title,
    description: req.body.description,
    category: req.body.category,
    image: upload.publicPath(req.file),
  };
  const status = await addComplaint(req.user, complain);
  const filter = { user: req.user.id };

  if (status !== true) {
    const data = await renderHomePage(req, res, { message: "Error while adding complaint" }, filter);
    return res.render("myComplaints", data);
  }
  const data = await renderHomePage(req, res, { message: "Complaint registered successfully" }, filter);
  res.render("myComplaints", data);
});

router.get("/add", (req, res) => {
  res.render("addComplaint", { error: null });
});

router.get("/myComplaints", async (req, res) => {
  const filter = { user: req.user.id };
  const data = await renderHomePage(req, res, {}, filter);
  res.render("myComplaints", data);
});

router.post("/resolve/:id", async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ user: req.user.id, _id: req.params.id });
    if (!complaint) return res.redirect("/user/home");

    // already resolved complaint pe dobara email na jaye
    const wasResolved = complaint.status === "resolved";

    complaint.status = "resolved";
    await complaint.save();

    // student ko aur admin ko dono ko email
    if (!wasResolved) mail.resolvedNotify(req.user, complaint, "student");

    const filter = { hostel_no: req.user.hostel_no, user: req.user.id };
    const data = await renderHomePage(req, res, { message: "Complaint resolved successfully." }, filter);
    res.render("myComplaints", data);
  } catch (err) {
    console.log("error while resolving complaint,", err);
    return res.redirect("/user/home");
  }
});
const NEXT_PRIORITY = { Low: "Medium", Medium: "High", High: "Urgent", Urgent: "Urgent" };

// Student resolved complaint par 1-5 rating deta hai
router.post("/rate/:id", async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ user: req.user.id, _id: req.params.id });
    if (!complaint) return res.redirect("/complaint/myComplaints");

    const rating = Number(req.body.rating);
    let message;

    if (complaint.status !== "resolved") {
      message = "You can rate a complaint only after it is resolved.";
    } else if (complaint.rating) {
      message = "You have already rated this complaint.";
    } else if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      message = "Rating must be between 1 and 5.";
    } else {
      complaint.rating = rating;
      complaint.feedback = (req.body.feedback || "").trim().slice(0, 300);
      await complaint.save();
      message = "Thanks for your feedback!";
    }

    const data = await renderHomePage(req, res, { message }, { user: req.user.id });
    res.render("myComplaints", data);
  } catch (err) {
    console.log("error while rating complaint,", err);
    return res.redirect("/complaint/myComplaints");
  }
});

// Student kehta hai "problem abhi bhi hai" -> complaint dobara khulti hai
router.post("/reopen/:id", async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ user: req.user.id, _id: req.params.id });
    if (!complaint) return res.redirect("/complaint/myComplaints");

    const reason = (req.body.reason || "").trim().slice(0, 300);
    let message;

    if (complaint.status !== "resolved") {
      message = "Only a resolved complaint can be reopened.";
    } else if (!reason) {
      message = "Please tell us what is still wrong.";
    } else {
      complaint.status = "not resolved";
      complaint.resolvedAt = null;
      complaint.reopenCount += 1;
      complaint.reopenedAt = new Date();
      complaint.reopenReason = reason;
      complaint.rating = null;
      complaint.feedback = "";
      // admin ne priority khud set ki ho to wahi rehne do, warna ek level badhao
      if (complaint.prioritySource !== "admin") {
        complaint.priority = NEXT_PRIORITY[complaint.priority] || complaint.priority;
      }
      await complaint.save();
      mail.reopenedNotify(req.user, complaint);
      message = "Complaint reopened. The warden will look at it again.";
    }

    const data = await renderHomePage(req, res, { message }, { user: req.user.id });
    res.render("myComplaints", data);
  } catch (err) {
    console.log("error while reopening complaint,", err);
    return res.redirect("/complaint/myComplaints");
  }
});
module.exports = router;