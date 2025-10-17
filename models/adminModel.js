// App ke top ki categories heeeee
// models/Student.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config'); // adjust this according to your project structure

// Define the Student model
const adminModel = sequelize.define('admin_mst', {
  admin_id : {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  adminuser_name: {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  admin_password: {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  admin_password_encrypted: {
    type: DataTypes.STRING(100), // Ensure sufficient length for hashed password
    allowNull: true,
  },
  is_active: {
    type: DataTypes.INTEGER,
    allowNull: true,
  }, 
  admin_type: {
    type: DataTypes.STRING,
    allowNull: true,
    default:"ADMIN"
  }, 
  school_id: {
    type: DataTypes.STRING,
   allowNull: true, 
  },
  lastlogindt: {
    type: DataTypes.DATE,
    allowNull: true,
  }, 
  added_date: {
   type: DataTypes.DATE,
    allowNull: true,
  }, 
  added_admin_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  }, 
  edited_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  edited_admin_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  }, 
  mobile_no: {
    type: DataTypes.INTEGER,
    allowNull: true,
  }, 
  parent_admin_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  }, 
  is_deleted : {
    type: DataTypes.INTEGER,
    defaultValue:0
  },   
}, {
  tableName: 'admin_mst', 
   timestamps: false,
});


module.exports = adminModel;