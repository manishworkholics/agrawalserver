const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config'); // adjust this according to your project structure

const RepliedMsgDetailModel = sequelize.define('replied_msg_body', {
  replied_msg_d_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  replied_msg_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  msg_body_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  msg_type: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  data_reply_text: {
    type: DataTypes.TEXT,
    allowNull: true,  // Assuming that the reply text is optional
  }
}, {
  tableName: 'replied_msg_body',  // Customize the table name if needed
  timestamps: false,  // Disable automatic timestamps if not needed
});

module.exports = RepliedMsgDetailModel;
