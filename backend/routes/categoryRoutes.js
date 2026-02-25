const express = require("express");
const protect = require("../middleware/authMiddleware");
const Category = require("../models/Category");
const httpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

const normalizeCategoryName = (name) => {
  if (typeof name !== "string") {
    return "";
  }

  return name.trim().toLowerCase();
};

router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const categories = await Category.find({ user: req.user })
      .select("_id name createdAt updatedAt")
      .sort({ name: 1 });

    res.json(categories);
  })
);

router.post(
  "/",
  protect,
  asyncHandler(async (req, res, next) => {
    const { name } = req.body;
    const normalizedName = normalizeCategoryName(name);

    if (!normalizedName) {
      return next(httpError(400, "Category name is required"));
    }

    if (normalizedName.length > 50) {
      return next(httpError(400, "Category name must be 50 characters or less"));
    }

    const existingCategory = await Category.findOne({
      user: req.user,
      normalizedName,
    });

    if (existingCategory) {
      return next(httpError(400, "Category already exists"));
    }

    const category = await Category.create({
      name: name.trim(),
      normalizedName,
      user: req.user,
    });

    res.status(201).json({
      _id: category._id,
      name: category.name,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    });
  })
);

module.exports = router;
