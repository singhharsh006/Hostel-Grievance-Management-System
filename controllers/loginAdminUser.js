const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const AdminUser = require("../models/adminUser");
require("dotenv").config();

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN;

// bcrypt hash hamesha $2a$ / $2b$ / $2y$ se shuru hota hai
const isHash = (s) => typeof s === "string" && /^\$2[aby]\$/.test(s);

const loginAdminUser = async (data) => {
  const username = String(data.username || "");
  const password = String(data.password || "");

  const adminUser = await AdminUser.findOne({ username });

  if (!adminUser) {
    throw new Error("User does not exist");
  }

  let valid = false;

  if (isHash(adminUser.password)) {
    valid = await bcrypt.compare(password, adminUser.password);
  } else {
    // Purana plain-text password: sahi login hone par apne aap hash ho jayega
    valid = password === adminUser.password;
    if (valid) {
      const hashed = await bcrypt.hash(password, 10);
      await AdminUser.updateOne({ _id: adminUser._id }, { $set: { password: hashed } });
    }
  }

  if (!valid) {
    throw new Error("Username or password is incorrect");
  }

  const token = jwt.sign(
    {
      id: adminUser._id,
      username: adminUser.username,
      hostel_no: adminUser.hostel_no,
      type: adminUser.type,
    },
    SECRET,
    { expiresIn: EXPIRES_IN }
  );

  return token;
};

module.exports = loginAdminUser;