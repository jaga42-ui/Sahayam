const cloudinary = require('cloudinary').v2;
const cloudinaryStorage = require('multer-storage-cloudinary');
const multer = require('multer');

// Connect to your Cloudinary account
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Set up the Cloud Engine for v2.2.1
const storage = cloudinaryStorage({
  cloudinary: require('cloudinary'),
  folder: 'hopelink_uploads',
  allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
  transformation: [{ width: 800, height: 800, crop: 'limit' }]
});

const upload = multer({ storage });

module.exports = { upload, cloudinary };