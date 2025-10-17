const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config'); // Adjust this according to your project structure

// Define the support model
const supportModel = sequelize.define(
  'support',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    parent_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.INTEGER,
    },
    remark: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    added_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    added_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    edited_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    edited_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'support', // Ensure this matches the table name in your database
    timestamps: false,
  }
);

module.exports = supportModel;
