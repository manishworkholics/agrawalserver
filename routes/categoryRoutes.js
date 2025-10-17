const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController.js');
const { authMiddleware } = require('../middlewares/authMiddleware.js');

router.get('/getCategoryDetail',authMiddleware, CategoryController.getCategoryDetail);
// Add a new category
router.post('/addCategory',authMiddleware, CategoryController.addCategory);

// Get a single category by ID
router.get('/getSingleCategoryDetail/:categoryid',authMiddleware, CategoryController.getCategoryDetail);

// Update a category by ID
router.put('/updateCategory/:categoryid',authMiddleware, CategoryController.updateCategory);

module.exports = router;
