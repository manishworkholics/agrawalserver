const express = require('express');
const router = express.Router();
const ScholarController = require('../controllers/scholarController');
const { authMiddleware } = require('../middlewares/authMiddleware.js');

router.get('/getScholarDetail',authMiddleware, ScholarController.getscholarDetail);
router.get('/getlist_main_student_detail',authMiddleware, ScholarController.getlist_main_student_detail);
router.get('/getlist_main_student_detail_two',authMiddleware, ScholarController.getlist_main_student_detail_two);
router.get('/get_full_list_app_active_users_list',authMiddleware, ScholarController.get_full_list_app_active_users_list);
router.get('/get_MainList_ScholarDetail',authMiddleware, ScholarController.get_MainList_ScholarDetail_DropDown);
router.post('/insertScholarRecord',authMiddleware, ScholarController.insertScholarRecord);
router.post('/bulk_Update_ScholarRecord', ScholarController.bulkUpdateScholars);

module.exports = router;
