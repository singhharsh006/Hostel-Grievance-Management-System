const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcrypt");
require("dotenv").config();

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN;

const loginUser = async (data) => {
  const email = String(data.email || "").trim().toLowerCase();
  const password = String(data.password || "");

  const user = await User.findOne({ email });

  // Same message for both cases, so nobody can check which emails are registered
  if (!user) {
    throw new Error("Email or password is incorrect");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new Error("Email or password is incorrect");
  }

  const token = jwt.sign(
    {
      id: user._id,
      username: user.username,
      hostel_no: user.hostel_no,
      room_no: user.room_no,
      phone: user.phone,
      email: user.email,
    },
    SECRET,
    { expiresIn: EXPIRES_IN }
  );

  return token;
};

module.exports = loginUser;