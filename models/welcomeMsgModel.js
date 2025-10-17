// App ke top ki categories heeeee
// models/Student.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config'); // adjust this according to your project structure

// Define the Student model
const appTopWelcomeMsgModel = sequelize.define('app_top_welcome_msg', {
  welcome_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  detail: {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
}, {
  tableName: 'app_top_welcome_msg', 
   timestamps: false,
});


module.exports = appTopWelcomeMsgModel;