const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();

// Uploads (profile pics, donation images, KYC documents) must be images — never
// arbitrary files. Reject anything else up front with a 400.
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const imageFileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error("Only image files (JPEG, PNG, WebP, GIF) are allowed.");
    err.status = 400;
    cb(err);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: imageFileFilter,
});

module.exports = { upload, cloudinary, imageFileFilter, ALLOWED_IMAGE_TYPES };