// App ke top ki categories heeeee
// models/Student.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config'); // adjust this according to your project structure

// Define the Student model
const msgMasterModel = sequelize.define('msg_mst', {
  msg_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  //GROUPCHAT ,INDIVIDUALCHAT INPUT DISPLAY
  msg_chat_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  five_mobile_number: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  subject_text: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  show_upto: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  msg_priority: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  msg_sgroup_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  is_reply_type: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  is_reply_required_any: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  entry_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  entry_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  edit_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  edit_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  school_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  no_of_recipients: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  seen: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  respond: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'msg_mst',
  timestamps: false,
});


module.exports = msgMasterModel;