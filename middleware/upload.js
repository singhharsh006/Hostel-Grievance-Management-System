// Image upload: max 2 MB, JPG / PNG / WEBP only.
// Photos are NOT saved on the server disk. They are sent to Cloudinary and we keep only the URL.
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    /^image\/(jpeg|png|webp)$/.test(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Only JPG, PNG or WEBP images are allowed")),
});

// Cloudinary is configured lazily, so .env is already loaded by the time this runs
let configured = false;
function isConfigured() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return false;
  if (!configured) {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
  return true;
}

const sendToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "hostel-complaints",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

// If upload fails, we don't crash: the error text is put in req.uploadError
const single = (field) => (req, res, next) =>
  upload.single(field)(req, res, async (err) => {
    if (err) {
      req.uploadError =
        err.code === "LIMIT_FILE_SIZE" ? "Image must be smaller than 2 MB" : err.message;
      return next();
    }
    if (!req.file) return next();

    if (!isConfigured()) {
      req.uploadError = "Image upload is not set up on the server";
      req.file = undefined;
      return next();
    }

    try {
      const result = await sendToCloudinary(req.file.buffer);
      req.file.url = result.secure_url;
    } catch (e) {
      console.error("Cloudinary upload failed:", e.message);
      req.uploadError = "Image could not be uploaded, please try again";
      req.file = undefined;
    }
    next();
  });

// Returns the full https URL of the uploaded image (or undefined if no image)
const publicPath = (file) => (file && file.url ? file.url : undefined);

module.exports = { single, publicPath };