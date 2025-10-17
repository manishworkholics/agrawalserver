
const asyncHandler = require("express-async-handler");
const CategoryModel = require("../models/categoryModel");

exports.getCategoryDetail = asyncHandler(async (req, res) => {
  try {
    // Fetch all records from the NoticeBoard table
    const category_detail = await CategoryModel.findAll();

    // Check if any data exists
    if (category_detail.length > 0) {
      res.status(200).json({
        status: true,
        message: "Data_Found",
        data: category_detail,
      });
    } else {
      res.status(200).json({
        status: false,
        message: "No_Data_Found",
        data: null,
      });
    }
  } catch (error) {
    // Log the error to the console for debugging
    console.error("Error fetching category  details:", error.message);

    // Send an error response to the client
    res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message, // Return the error message for debugging (optional)
    });
  }
});

// Add a new category
exports.addCategory = asyncHandler(async (req, res) => {
  const { title } = req.body;

  try {
    const newCategory = await CategoryModel.create({ title });

    res.status(201).json({
      status: true,
      message: "Category added successfully",
      data: newCategory,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error adding category",
      error: error.message,
    });
  }
});

// Get a single category by ID
exports.getCategoryDetail = asyncHandler(async (req, res) => {
  const { categoryid } = req.params;

  try {
    const category = await CategoryModel.findByPk(categoryid);

    if (category) {
      res.status(200).json({
        status: true,
        message: "Category found",
        data: category,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Category not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error fetching category",
      error: error.message,
    });
  }
});

// Update an existing category
exports.updateCategory = asyncHandler(async (req, res) => {
  const { categoryid } = req.params;
  const { title } = req.body;

  try {
    const category = await CategoryModel.findByPk(categoryid);

    if (category) {
      category.title = title;
      await category.save();

      res.status(200).json({
        status: true,
        message: "Category updated successfully",
        data: category,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Category not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error updating category",
      error: error.message,
    });
  }
});
