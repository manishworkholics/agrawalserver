const express = require('express');
const router = express.Router();
const NoticeBoardController = require('../controllers/noticeboardController');
const { authMiddleware,authMiddlewares } = require('../middlewares/authMiddleware.js');

router.get('/getNoticeBoardDetail',authMiddlewares, NoticeBoardController.getNoticeBoardDetail);
router.get('/getNoticeBoardDetails', NoticeBoardController.getNoticeBoardDetails);
router.get('/getAllNoticeBoardDetail',authMiddleware, NoticeBoardController.getAllNoticeBoardDetail);
router.post('/addDocument',authMiddleware, NoticeBoardController.addDocument);
router.get('/getSingleDocumentDetail/:id',authMiddleware, NoticeBoardController.getSingleDocumentDetail);
router.put('/updateDocument/:id',authMiddleware, NoticeBoardController.updateDocument);
router.delete('/deleteDocument/:id',authMiddleware, NoticeBoardController.deleteDocument);

module.exports = router;
