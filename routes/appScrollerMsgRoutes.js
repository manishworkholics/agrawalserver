const express = require('express');
const router = express.Router();
const appScrollerMsgController = require('../controllers/appScrollerMsgController');
const { authMiddleware } = require('../middlewares/authMiddleware.js');

router.get('/getAppScrollerMsgDetail',authMiddleware, appScrollerMsgController.getappScrollerMsgDetail);
// Route to get a single record by ID
router.get('/getSingleScrollerData/:scroller_id',authMiddleware, appScrollerMsgController.getSingleScrollerData);
// Route to create a new record
router.post('/createScrollerData',authMiddleware, appScrollerMsgController.createScrollerData);
// Route to update a record by ID
router.put('/updateScrollerData/:scroller_id',authMiddleware, appScrollerMsgController.updateScrollerData);
// Route to delete a record by ID
router.delete('/deleteScrollerData/:scroller_id',authMiddleware, appScrollerMsgController.deleteScrollerData);

module.exports = router;
