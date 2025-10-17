const express = require('express');
const router = express.Router();
const ChatMsgController = require('../controllers/chatMessageController.js');
const { authMiddleware, authMiddlewares } = require('../middlewares/authMiddleware.js');

router.post('/send_chat_msg1',authMiddleware, ChatMsgController.sendMessage1);
router.post('/send_chat_msg_individual',authMiddleware, ChatMsgController.sendMessage_individual_chat);





// Add a new category
router.get('/get_group_chat_message', ChatMsgController.getChatGroupMessagesByGroupId);

// Get all messages for a specific chat room (msg_id)
router.get('/get_individual_chat_messages', ChatMsgController.getMessages_individual_chat);

module.exports = router;


