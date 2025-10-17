const express = require('express');
const router = express.Router();
const CombineController = require('../controllers/combinedController');
const { authMiddleware ,authMiddlewares} = require('../middlewares/authMiddleware.js');

router.get('/getCombineHomePageDetail/:mobile_no', CombineController.getCombineHomePageDetail);
router.get('/getRelatedProfile', CombineController.getRelatedProfile);
router.get('/dashboardcount',authMiddleware, CombineController.dashboardcount);
router.post('/updateStudentTabStatus', CombineController.updateStudentTabStatus);

module.exports = router;
