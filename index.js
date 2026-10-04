require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const { connectDB } = require("./db/db");

const userRouter = require("./routes/userRouter");
const complainRouter = require("./routes/complainRouter");
const adminRouter = require("./routes/adminRouter");
const authMiddleware = require("./middleware/auth");

const app = express();

app.set("view engine", "ejs");
app.set("views", "./views");
// Render jaise hosting par proxy ke peeche IP sahi pehchanne ke liye
app.set("trust proxy", 1);

// Security headers. CSP abhi off hai, kyunki Tailwind/Flowbite CDN aur inline scripts toot jayenge
app.use(helmet({ contentSecurityPolicy: false, referrerPolicy: { policy: "same-origin" } }));

// Login par password guess karne se rokne ke liye: 15 minute mein 10 koshish
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many login attempts. Please try again after 15 minutes.",
});
app.post("/user/login", loginLimiter);
app.post("/admin/login", loginLimiter);

// Fake accounts ki bhar-maar rokne ke liye: ek IP se 1 ghante mein 10 signup
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many signups from this network. Please try again later.",
});
app.post("/user/register", registerLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("./public"));

// CSRF defence: POST/PUT/DELETE sirf apni hi site se aani chahiye
app.use((req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

  // Modern browsers Sec-Fetch-Site bhejte hain, ye sabse bharosemand hai
  const site = req.get("sec-fetch-site");
  if (site) {
    if (site === "same-origin" || site === "none") return next();
    return res.status(403).send("Blocked: cross-site request");
  }

  // Purane browsers / curl: Origin ya Referer se check
  const source = req.get("origin") || req.get("referer");
  if (!source) return next();
  try {
    if (new URL(source).host === req.get("host")) return next();
  } catch (e) {}
  return res.status(403).send("Blocked: cross-site request");
});

app.use("/user", userRouter);
app.use("/complaint", authMiddleware, complainRouter);
app.use("/admin", adminRouter);

app.get("/", (req, res) => {
  res.redirect("/user");
});

// Express 5 fallback
app.use((req, res) => {
  res.redirect("/user");
});

const PORT = process.env.PORT || 1080;

(async () => {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Hostel Complaint Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server");
    console.error(err);
  }
})();