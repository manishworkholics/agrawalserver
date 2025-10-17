// App ki First screen heeeeeeee

// models/Student.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config'); // adjust this according to your project structure

// Define the Student model
const NoticeBoardModel = sequelize.define('notice_board_detail', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  document_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  document_link: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  school_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  thumbnails : {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'notice_board_detail', 
   timestamps: false,
});

module.exports = NoticeBoardModel;