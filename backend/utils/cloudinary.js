const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key:    process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

// Storage for profile avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "social_app/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// Storage for post images
const postStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "social_app/posts",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1080, quality: "auto" }],
  },
});

const uploadPostImage = multer({
  storage: postStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

async function deleteFromCloudinary(publicId) {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
}

module.exports = { cloudinary, uploadAvatar, uploadPostImage, deleteFromCloudinary };