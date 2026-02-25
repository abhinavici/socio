const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
  },
  { timestamps: true }
);

// Speeds up task list/filter endpoints scoped to a user.
taskSchema.index({ user: 1, createdAt: -1 });
taskSchema.index({ user: 1, status: 1, updatedAt: -1 });
taskSchema.index({ user: 1, category: 1, updatedAt: -1 });

module.exports = mongoose.model("Task", taskSchema);
