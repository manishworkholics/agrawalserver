const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Users = sequelize.define(
  'users',
  {
    parents_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    student_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    mobile_no: {
      type: DataTypes.STRING(15),
      allowNull: true,
      defaultValue: null,
    },
    scholar_dob: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    scholar_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    scholar_type: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    scholar_no: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    sch_short_nm: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    otp: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: null,
    },
    otp_datetime: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    is_verified: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: null,
    },
    app_token: {
      type: DataTypes.STRING(1000), // your DB allows up to 1000
      allowNull: true,
      defaultValue: null,
    },
    fcm_token: {
      type: DataTypes.STRING(250),
      allowNull: true,
      defaultValue: null,
    },
    mobile_uuid: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
    },
    mobile_info: {
      type: DataTypes.STRING(4000),
      allowNull: true,
      defaultValue: null,
    },
    mobile_platform: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
    },
    last_visit_on: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    is_active: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 1,
    },
    active_datetime: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    app_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
    },
    noticeMsg: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    registerby_mobile: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    tableName: 'users',
    timestamps: false,
  }
);

module.exports = Users;
