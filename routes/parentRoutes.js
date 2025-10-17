const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');
const { authMiddleware } = require('../middlewares/authMiddleware.js');

router.post('/signup', parentController.signUp);
router.post('/login', parentController.login);
router.post('/otp', parentController.generateOtp);
router.post('/resentOtp', parentController.resentOtp);
router.post('/otp-verify', parentController.otpverify);
router.put('/update_data', parentController.updateData);
router.post('/updateFcmToken', parentController.updateFcmToken);
// router.get('/getAllParent', parentController.getAllParent);
// router.get('/getAllParentWebOnly', parentController.getAllParentWebOnly);

module.exports = router;
