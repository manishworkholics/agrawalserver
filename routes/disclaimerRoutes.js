const express = require('express');
const router = express.Router();
const disclaimerController = require('../controllers/disclaimerController.js');

router.get('/getdisclaimerDetail', disclaimerController.getdisclaimerDetail);

module.exports = router;
