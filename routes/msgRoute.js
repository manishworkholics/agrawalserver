const express = require('express');
const router = express.Router();
const MsgController = require('../controllers/msgController.js');
const { authMiddleware, authMiddlewares } = require('../middlewares/authMiddleware.js');


router.post('/addSubGroup', MsgController.addSubGroup);
router.get('/getSubGroupDetail', MsgController.getSubGroupData);
router.get('/getSingleSubGroup/:id', MsgController.getSingleSubGroup);
router.delete('/deleteSubGroup/:msg_sgroup_id', MsgController.deleteSubGroup);
router.put('/updateSubGroup/:id', MsgController.updateSubGroup);

router.get('/searchGroups', MsgController.searchGroups);
router.get('/searchSubGroups', MsgController.searchSubGroups);


router.get('/getGroupDetail', MsgController.getGroupData);
router.delete('/deleteGroup/:id', MsgController.deleteGroup);
router.post('/addSingleGroupData', MsgController.addSingleGroupData);

router.get('/getSingleGroupData/:id', MsgController.getSingleGroupData);
router.put('/updateSingleGroupData/:msg_group_id', MsgController.updateSingleGroupData);

router.get('/getMsgDetail', MsgController.getmsgMaster);
router.get('/get_web_single_msg_master', MsgController.get_web_single_msg_master);
router.delete('/delete_web_single_msg_master', MsgController.delete_web_single_msg_master);



router.get('/getSearchDetail', MsgController.getSearchDetail);
// App mobile app start
//this is for just single master msg
router.get('/get_single_mst_msg_by_msg_id', authMiddlewares, MsgController.get_Single_Msg_master_Detail_by_msg_id);
router.get('/get_single_mst_msg_by_msg_ids', MsgController.get_Single_Msg_master_Detail_by_msg_ids);

//getSingleMsgDetail by  sended_msg_id
router.get('/getSingleMsgDetail/:sended_msg_id', MsgController.getSingleMsgDetail);
router.get('/toggleMessageStatus', MsgController.toggleMessageStatus);


router.put('/seenStatusUpdateMsgDetail/:sended_msg_id', MsgController.seenStatusUpdateMsgDetail);
router.put('/staredStatusUpdateMsgDetail/:sended_msg_id', MsgController.staredStatusUpdateMsgDetail);
// App mobile app End


// =========================ye api seprate school + admin ko use hogi=======================================
router.get('/SentMsgToScholarData', MsgController.SentMsgToScholarData);
router.get('/SendDirectMsgToScholar', MsgController.SendDirectMessage);
// ==============================================================
router.post('/insertRepliedMessageAndBodies', MsgController.insertRepliedMessageAndBodies);
router.get('/getAllReplyMessages', MsgController.getAllReplyMessages);
router.get('/reply-messages', MsgController.getReplyByMsgAndSendedId);
// ==============================================================
router.get('/test', MsgController.getmsgbody);
// router.get('/testing2/:mobile',authMiddleware, MsgController.testing2);

router.post('/insertMsgData', MsgController.insertMsgData);
router.put('/updateMessageGroupData', MsgController.updateMsgData);
router.delete('/delete_MessageGroupData/:msg_id', MsgController.deleteMsgData);
router.get('/get_MessageGroupData/:msg_id', MsgController.getSingleMsgDetailById);



router.get('/getInboxMsgDetails/:mobile', authMiddlewares, MsgController.getInboxMsgDetails);
router.get('/getSeenMsgDetails/:mobile', authMiddlewares, MsgController.getSeenMsgDetails);
router.get('/getStaredMsgDetails/:mobile', authMiddlewares, MsgController.getStaredMsgDetails);
router.get('/getLastdayMsgDetails/:mobile', authMiddlewares, MsgController.getLastdayMsgDetails);


module.exports = router;
