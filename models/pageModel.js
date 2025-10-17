// App ke top ki categories heeeee
// models/Student.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config'); // adjust this according to your project structure

// Define the Student model
const pageModel = sequelize.define('page', {
  pageid: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
 numberassign: {
    type: DataTypes.INTEGER,
    allowNull: true,
  }, 
  pagecode: {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
 title: {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  detail: {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
}, {
  tableName: 'page', 
   timestamps: false,
});


module.exports = pageModel;