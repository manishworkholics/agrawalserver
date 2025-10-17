// App ke top ki categories heeeee
// models/Student.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config'); // adjust this according to your project structure

// Define the Student model
const scholarModel = sequelize.define('scholar_data', {
  scholar_data_id : {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  mobile_no: {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  sch_short_nm: {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  scholar_no: {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  scholar_type: {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  scholar_otp: {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  // scholar_dob: {
  //   type: DataTypes.STRING,
  //   allowNull: true,
  // }, 
  // scholar_email: {
  //   type: DataTypes.STRING,
  //   allowNull: true,
  // }, 
}, {
  tableName: 'scholar_data', 
   timestamps: false,
});


module.exports = scholarModel;