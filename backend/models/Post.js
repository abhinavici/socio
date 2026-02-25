const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    caption: {
      type: String,
      maxlength: 500,
      default: "",
    },
    image: {
      type: String,
      default: "",       // Cloudinary URL
    },
    imagePublicId: {
      type: String,
      default: "",       // For deleting from Cloudinary
    },
    likesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);