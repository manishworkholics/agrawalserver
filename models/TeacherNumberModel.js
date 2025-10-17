// models/Teacher.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config'); // Adjust this according to your project structure

// Define the Teacher model
const teacherNumberModel = sequelize.define('teacher', {
  teacherId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mobileNo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'teachers', // Make sure this matches your table name in the database
  timestamps: false,
});

module.exports = teacherNumberModel;
