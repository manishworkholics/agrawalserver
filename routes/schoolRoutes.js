const express = require('express');
const router = express.Router();
const schoolController = require("../controllers/schoolController");

const { authMiddleware } = require('../middlewares/authMiddleware.js');

router.get('/getSchool',authMiddleware, schoolController.getSchool);
router.get('/getSingleSchool/:id',authMiddleware, schoolController.getSingleSchool);
router.post('/createSchool',authMiddleware, schoolController.createSchool);
router.put('/updateSchool/:id',authMiddleware, schoolController.updateSchool);
router.delete('/deleteSchool/:id',authMiddleware, schoolController.deleteSchool);
router.get('/getSearch_school_Detail',authMiddleware, schoolController.getSearch_school_Detail);


module.exports = router;
