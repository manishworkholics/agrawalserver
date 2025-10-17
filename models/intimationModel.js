// models/Student.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config'); // adjust this according to your project structure

// Define the Student model
const intimationModel = sequelize.define('category', {
  intimationid: {
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
  sentTo: {
    type: DataTypes.ARRAY(DataTypes.INTEGER), // Store user IDs to whom the intimation was sent
    allowNull: true,
  },
  seenBy: {
    type: DataTypes.ARRAY(DataTypes.INTEGER), // Store user IDs who have seen the intimation
    allowNull: true,
  }
}, {
  tableName: 'category', 
   timestamps: false,
});


module.exports = intimationModel;