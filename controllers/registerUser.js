const User = require("../models/User");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const ALLOWED_HOSTELS = ["H1", "H2", "H3", "H4"];

const registerUser = async (data) => {
  const email = String(data.email || "").trim().toLowerCase();
  const phone = String(data.phoneNumber || "").trim();
  const room = String(data.roomNumber || "").trim();
  const password = String(data.password || "");

  if (!ALLOWED_HOSTELS.includes(data.hostelNumber)) {
    throw new Error("Please choose a valid hostel");
  }
  if (!/^[0-9]{10}$/.test(phone)) {
    throw new Error("Phone number must be 10 digits");
  }
  if (!/^[0-9]{1,4}$/.test(room)) {
    throw new Error("Room number must be digits only");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  let existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("email is already registered");
  }
  existingUser = await User.findOne({ phone });
  if (existingUser) {
    throw new Error("phone number is already registered");
  }

  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const newUser = new User({
    username: data.userName,
    email,
    phone,
    hostel_no: data.hostelNumber,
    room_no: room,
    password: hashedPassword,
  });
  await newUser.save();
  return true;
};

module.exports = registerUser;