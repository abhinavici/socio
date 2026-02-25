const express = require("express");
const mongoose = require("mongoose");
const protect = require("../middleware/authMiddleware");
const Task = require("../models/Task");
const Category = require("../models/Category");
const httpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();
const VALID_STATUSES = new Set(["pending", "completed"]);

const normalizeText = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const resolveCategory = async (rawCategory, userId) => {
  if (rawCategory === null || rawCategory === "") {
    return { value: null };
  }

  if (!mongoose.Types.ObjectId.isValid(rawCategory)) {
    return { error: "Invalid category id" };
  }

  const category = await Category.findOne({
    _id: rawCategory,
    user: userId,
  }).select("_id");

  if (!category) {
    return { error: "Category not found" };
  }

  return { value: category._id };
};

router.post(
  "/",
  protect,
  asyncHandler(async (req, res, next) => {
    const trimmedTitle = normalizeText(req.body.title);
    const trimmedDescription = normalizeText(req.body.description);

    if (!trimmedTitle) {
      return next(httpError(400, "Title is required"));
    }

    let categoryValue = null;
    if (req.body.category !== undefined) {
      const categoryResolution = await resolveCategory(req.body.category, req.user);
      if (categoryResolution.error) {
        return next(httpError(400, categoryResolution.error));
      }
      categoryValue = categoryResolution.value;
    }

    const task = await Task.create({
      title: trimmedTitle,
      description: trimmedDescription,
      user: req.user,
      category: categoryValue,
    });

    const populatedTask = await Task.findById(task._id).populate("category", "name");
    res.status(201).json(populatedTask);
  })
);

router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const tasks = await Task.find({ user: req.user })
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.json(tasks);
  })
);

router.put(
  "/:id",
  protect,
  asyncHandler(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(httpError(400, "Invalid task id"));
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(httpError(404, "Task not found"));
    }

    if (task.user.toString() !== req.user) {
      return next(httpError(401, "Not authorized"));
    }

    if (req.body.title !== undefined) {
      const nextTitle = normalizeText(req.body.title);
      if (!nextTitle) {
        return next(httpError(400, "Title cannot be empty"));
      }
      task.title = nextTitle;
    }

    if (req.body.description !== undefined) {
      task.description = normalizeText(req.body.description);
    }

    if (req.body.status !== undefined) {
      if (!VALID_STATUSES.has(req.body.status)) {
        return next(httpError(400, "Invalid status value"));
      }
      task.status = req.body.status;
    }

    if (req.body.category !== undefined) {
      const categoryResolution = await resolveCategory(req.body.category, req.user);
      if (categoryResolution.error) {
        return next(httpError(400, categoryResolution.error));
      }
      task.category = categoryResolution.value;
    }

    await task.save();
    await task.populate("category", "name");

    res.json(task);
  })
);

router.delete(
  "/:id",
  protect,
  asyncHandler(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(httpError(400, "Invalid task id"));
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(httpError(404, "Task not found"));
    }

    if (task.user.toString() !== req.user) {
      return next(httpError(401, "Not authorized"));
    }

    await task.deleteOne();

    res.json({ message: "Task removed successfully" });
  })
);

module.exports = router;
