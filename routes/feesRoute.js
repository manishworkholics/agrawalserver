const express = require('express');
const router = express.Router();
const feesDisplayController = require('../controllers/feesController.js');
const { authMiddleware,authMiddlewares } = require('../middlewares/authMiddleware.js');

router.get('/getFeesDisplayDetail',authMiddleware, feesDisplayController.getallfeesDisplayDetail);
//==== For Mobile start ====
router.get('/getFeesDetail',authMiddlewares, feesDisplayController.getFeesDetailByMobile);
//==== For Mobile End =======
router.get('/getSingleFeesDisplayDetail/:id',authMiddleware, feesDisplayController.getSingleFeesDisplayDetail);
// Add a new feesDisplay
router.post('/addfeesDisplay',authMiddleware, feesDisplayController.addfeesDisplay);

// Get a single feesDisplay by ID
router.get('/getSinglefeesDisplayDetail/:feesDisplayid',authMiddleware, feesDisplayController.getSinglefeesDisplayDetail);

// Update a feesDisplay by ID
router.put('/updatefeesDisplay/:feesDisplayid',authMiddleware, feesDisplayController.updatefeesDisplay);


router.delete('/deletefeesDisplay',authMiddleware, feesDisplayController.deleteSingleFeesRecord);

module.exports = router;
