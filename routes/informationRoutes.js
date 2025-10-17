const express = require('express');
const router = express.Router();
const informationController = require('../controllers/informationController.js');

router.get('/getinformationDetail', informationController.getinformationDetail);

module.exports = router;
