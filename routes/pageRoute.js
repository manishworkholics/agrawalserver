const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const { authMiddleware } = require('../middlewares/authMiddleware.js');

 router.get('/getpageDetail',authMiddleware, pageController.getAllpageDetail);
//  This Api for app use only
 router.get('/getAppPageDetail',authMiddleware, pageController.getAppPageDetail);
// // Add a new page
 router.post('/addpage',authMiddleware, pageController.addpage);

// // Get a single page by ID
 router.get('/getSinglepageDetail/:pageid',authMiddleware, pageController.getpageDetail);

// // Update a page by ID
 router.put('/updatepage/:numberassign',authMiddleware, pageController.updatepage);

module.exports = router;
