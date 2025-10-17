// models/Message.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config'); // Adjust this according to your project structure
const StudentModel = require('./studentModel'); // Import Student model
const msgMasterModel = require('./msgMasterModel'); // Import Student model

const ChatMessage = sequelize.define('Chat_Message', {
  chat_msg_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  msg_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // GROUPCHAT  INDIVIDUALCHAT  INPUT DISPLAY
  chat_type: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  link: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // TEXT IMAGE PDF
  msg_type: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  sender_detail: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  mobile_no: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  private_message: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  receiver_id: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // receiver_id: {
  //   type: DataTypes.INTEGER,
  //   allowNull: true,   
  // },
  group_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  sent_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  // This id is used for Individual Chat
  chat_id: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
}, {
  tableName: 'Chat_Message',
  timestamps: false,
});



module.exports = ChatMessage;
