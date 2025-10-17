// App ke top ki categories heeeee
// models/Student.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config'); // adjust this according to your project structure

// Define the Student model
const appScrollerMsgModel = sequelize.define('app_top_scroller_msg', {
  scroller_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  detail: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'app_top_scroller_msg',
  timestamps: false,
});


module.exports = appScrollerMsgModel;