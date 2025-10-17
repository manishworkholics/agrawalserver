const express = require('express');
const router = express.Router();
const appuserController = require('../controllers/appUserController');
const { authMiddleware } = require('../middlewares/authMiddleware.js');

router.get('/get-appUser',authMiddleware, appuserController.getappuser);


module.exports = router;