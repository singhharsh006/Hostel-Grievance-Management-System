const express = require("express");
const router = express.Router();
const User = require("../models/User");
const registerUser = require("../controllers/registerUser");
const loginUser = require("../controllers/loginUser");
const authMiddleware = require("../middleware/auth");
const Complaint = require("../models/Complaint");
const renderHomePage = require("../utils/renderHomePage");

router.post("/register", async (req, res) => {
  try {
    const status = await registerUser(req.body);
    if (status != true) {
      throw new Error("user registration failed");
    }
    const data = {
      message: "Please login now.",
    };
    res.render("login", data);
  } catch (err) {
    console.log("error while registering user, ", err);
    const data = {
      message: `cannot create user: ${err.message}`,
    };
    res.render("register", data);
  }
});

router.get("/register", (req, res) => {
  res.render("register");
});

router.get("/login", (req, res) => {
  const token = req.cookies.token;
  if (token) {
    return res.redirect("/user/home");
  }
  if (req.user) {
    res.redirect("/user/home");
  }
  res.render("login");
});
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  res.redirect("/user/login");
});

router.post("/login", async (req, res) => {
  try {
    const token = await loginUser(req.body);
    if (!token) {
      throw new Error("user login failed");
    }
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    res.redirect("/user/home");
  } catch (err) {
    const data = {
      message: `Login error: ${err.message}`,
    };
    console.error("login error: ", err);
    res.render("login", data);
  }
});

router.get("/home", authMiddleware, async (req, res) => {
  const filter = {
    status: "not resolved",
    hostel_no: req.user.hostel_no,
  };
  const data = await renderHomePage(req, res, {}, filter);
  res.render("home", data);
});

router.all("/{*splat}", (req, res) => {
  res.redirect("/user/login");
});
module.exports = router;
