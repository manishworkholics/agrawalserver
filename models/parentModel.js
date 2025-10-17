const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config'); // adjust this according to your project structure

const Parents = sequelize.define('Parents', {
  parents_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  mobile_no: {
    type: DataTypes.STRING(15),
    allowNull: true,
    defaultValue: null,
  },
  // ==================
  scholar_no: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },
  scholar_dob: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  scholar_email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  student_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  scholar_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // msg_seen_no: {
  //   type: DataTypes.ARRAY(DataTypes.STRING),
  //   allowNull: true,
  // },
  // msg_starred_no: {
  //   type: DataTypes.ARRAY(DataTypes.STRING),
  //   allowNull: true,
  // },
  // ===================
  otp: {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: null,
  },
  sch_short_nm: {
    type: DataTypes.STRING(255),
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
    index: true,
  },
  verified_datetime: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  ip_address: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: null,
  },
  fail_attempt: {
    type: DataTypes.TINYINT,
    allowNull: true,
    defaultValue: null,
  },
  fail_datetime: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  app_token: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: null,
    index: true,
  },
  is_app: {
    type: DataTypes.TINYINT,
    allowNull: true,
    defaultValue: null,
    index: true,
  },
  registerby_mobile: {
    type: DataTypes.TINYINT,
    allowNull: true,
    defaultValue: 0,
    index: true,
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
    index: true,
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
    index: true,
  },
  active_datetime: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  active_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
  user_agent: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    defaultValue: null,
  },
  app_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: null,
    index: true,
  },
  app_vercode: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
  manufacturer: {
    type: DataTypes.STRING(250),
    allowNull: true,
    defaultValue: null,
  },
  model: {
    type: DataTypes.STRING(250),
    allowNull: true,
    defaultValue: null,
  },
  version: {
    type: DataTypes.STRING(250),
    allowNull: true,
    defaultValue: null,
  },
  sch_ids: {
    type: DataTypes.STRING(500),
    allowNull: true,

  },
  noticeMsg: {
    type: DataTypes.STRING(500),
    allowNull: true,

  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  tableName: 'parents',
  timestamps: false, // Since there are no created_at or updated_at fields
});

module.exports = Parents;
