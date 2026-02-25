const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    normalizedName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

categorySchema.index({ user: 1, normalizedName: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);
