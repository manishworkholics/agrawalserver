const express = require('express');
const router = express.Router();
const appTopWelcomeMsgDetailController = require('../controllers/appTopWelcomeMsgController');
const { authMiddleware } = require('../middlewares/authMiddleware.js');

router.get('/appTopWelcomeMsg',authMiddleware, appTopWelcomeMsgDetailController.getappTopWelcomeMsgDetail);
// Routes
router.post('/createAppTopWelcomeMsg',authMiddleware, appTopWelcomeMsgDetailController.createAppTopWelcomeMsg);
router.get('/getSingleAppTopWelcomeMsg/:welcome_id',authMiddleware, appTopWelcomeMsgDetailController.getSingleAppTopWelcomeMsg);
router.put('/updateAppTopWelcomeMsg/:welcome_id',authMiddleware, appTopWelcomeMsgDetailController.updateAppTopWelcomeMsg);
router.delete('/deleteAppTopWelcomeMsg/:welcome_id',authMiddleware, appTopWelcomeMsgDetailController.deleteAppTopWelcomeMsg);

module.exports = router;
