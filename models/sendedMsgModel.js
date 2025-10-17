// App ke top ki categories heeeee
// models/Student.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config'); // adjust this according to your project structure

// Define the Student model
const sendedMsgModel = sequelize.define('sended_msg', {
  sended_msg_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  msg_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    index: true
  },
  mobile_no: {
    type: DataTypes.STRING(10),
    allowNull: true,
    index: true
  },
  sch_short_nm: {
    type: DataTypes.STRING(10),
    allowNull: true,
    index: true
  },
  scholar_no: {
    type: DataTypes.STRING(10),
    allowNull: true,
    index: true
  },
  sended_date: {
    type: DataTypes.DATE,
    allowNull: true,
    index: true
  },
  sended_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  is_seen: {
    type: DataTypes.TINYINT(3).UNSIGNED,
    allowNull: true,
    default:0
  },
  seen_on: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  is_starred: {
    type: DataTypes.TINYINT(3).UNSIGNED,
    allowNull: true,
    index: true
  },
  starred_on: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  is_reply_done: {
    type: DataTypes.TINYINT(3).UNSIGNED,
   default:0
  },
  reply_on: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  is_fcm_sended: {
    type: DataTypes.TINYINT(3).UNSIGNED,
    allowNull: true,
    defaultValue: 0
  },
  admission_id: {
    type: DataTypes.INTEGER,
   allowNull: true,
    defaultValue: 0
  },
  class_subject_videos_id: {
    type: DataTypes.INTEGER,
   allowNull: true,
    defaultValue: 0
  },
  class_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  subject_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  }
}, {
  tableName: 'sended_msg', 
   timestamps: false,
});


module.exports = sendedMsgModel;