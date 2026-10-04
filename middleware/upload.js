// Image upload: max 2 MB, JPG / PNG / WEBP only. Files go to public/uploads/complaints
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const dir = path.join(__dirname, "..", "public", "uploads", "complaints");
fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) =>
    cb(null, crypto.randomBytes(12).toString("hex") + path.extname(file.originalname).toLowerCase()),
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    /^image\/(jpeg|png|webp)$/.test(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Only JPG, PNG or WEBP images are allowed")),
});

// If upload fails, we don't crash: the error text is put in req.uploadError
const single = (field) => (req, res, next) =>
  upload.single(field)(req, res, (err) => {
    if (err) {
      req.uploadError =
        err.code === "LIMIT_FILE_SIZE" ? "Image must be smaller than 2 MB" : err.message;
    }
    next();
  });

const publicPath = (file) => (file ? "/uploads/complaints/" + file.filename : undefined);

module.exports = { single, publicPath };
