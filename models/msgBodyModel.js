// App ke top ki categories heeeee
// models/Student.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config'); // adjust this according to your project structure

// Define the Student model
const msgBodyModel = sequelize.define('msg_body', {
  msg_body_id : {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  msg_id : {
    type: DataTypes.INTEGER,
    allowNull: true,
  }, 
  msg_type : {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  data_text : {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  is_reply_required : {
    type: DataTypes.TINYINT,
    allowNull: true,
  }, 
  ordersno : {
    type: DataTypes.INTEGER,
    allowNull: true,
  }, 
}, {
  tableName: 'msg_body', 
   timestamps: false,
});


module.exports = msgBodyModel;