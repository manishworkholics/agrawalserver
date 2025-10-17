const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController.js');
const { authMiddleware } = require('../middlewares/authMiddleware.js');

router.post('/createAdmin',authMiddleware, adminController.createAdmin);
router.post('/loginAdmin', adminController.loginAdmin);
router.put('/updatePassword',authMiddleware, adminController.updatePassword);
router.put('/updateProfileDetail/:admin_id',authMiddleware, adminController.updateProfileDetail);
router.get('/getAllAdmin',authMiddleware, adminController.getAllAdmin);
router.get('/getSingleAdmin/:id',authMiddleware, adminController.getSingleAdmin);
router.delete('/deleteAdmin/:id',authMiddleware, adminController.deleteAdmin);

router.post("/imageUpload", adminController.imageUpload);
router.post("/pdfUpload", adminController.pdfUpload);


module.exports = router;