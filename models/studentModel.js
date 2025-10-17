// App ke top ki categories heeeee
// models/Student.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config'); // adjust this according to your project structure
const parentModel = require('./parentModel'); // Import Parent model

// Define the Student model
const studentModel = sequelize.define('scholar', {
  student_main_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  student_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  student_dob: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  student_email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  scholar_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  student_number: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  student_family_mobile_number: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  tab_active_by_mobile: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  tab_active_status: {
    type: DataTypes.TINYINT,
    allowNull: true,
    defaultValue: 1
  },
  sch_short_nm: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  noticeMsg: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  remark: {
    type: DataTypes.STRING,
    allowNull: true,
  },
   is_active: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 1,
      index: true,
    },
  // parents_id: {
  //   type: DataTypes.INTEGER, // Updated to INTEGER to match Parent model's ID
  //   allowNull: true,
  //   references: {
  //     model: 'parents', // name of the Parent model table
  //     key: 'parents_id', // key to match in the Parent model
  //   },
  // },

}, {
  tableName: 'scholar',
  timestamps: false,
});

// studentModel.belongsTo(parents, { foreignKey: 'parent_id', as: 'parent' });

module.exports = studentModel;