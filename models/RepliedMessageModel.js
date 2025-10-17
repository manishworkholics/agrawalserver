const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config'); // adjust this according to your project structure

const RepliedMessageModel = sequelize.define('replied_msg', {
  replied_msg_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  sended_msg_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  msg_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  mobile_no: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  reply_date_time: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
 
  student_main_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  student_number: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'replied_msg', // Customize the table name according to your requirements
  timestamps: false, // Disable automatic creation of createdAt/updatedAt fields
});

module.exports = RepliedMessageModel;
