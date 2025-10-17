
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config'); // adjust this according to your project structure

// Define the Student model
const schoolModel = sequelize.define('sch_mst', {
  sch_id : {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  sch_nm: {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  sch_short_nm : {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  is_active  : {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  entry_date  : {
    type: DataTypes.DATE,
    allowNull: true,
  }, 
  entry_by  : {
    type: DataTypes.INTEGER,
    allowNull: true,
  }, 
  edit_date  : {
    type: DataTypes.DATE,
    allowNull: true,
  }, 
  edit_by  : {
    type: DataTypes.INTEGER,
    allowNull: true,
  }, 
  scroll_news_text  : {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  def_msg_ids  : {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  text_color  : {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  bg_color  : {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  address  : {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  contact_no  : {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  website  : {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  email_id  : {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  logo_img  : {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  session  : {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  season  : {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  mail_email_id  : {
    type: DataTypes.STRING,
    allowNull: true,
  },
  is_deleted : {
    type: DataTypes.INTEGER,
    defaultValue:0
  }, 
}, {
  tableName: 'sch_mst', 
   timestamps: false,
});


module.exports = schoolModel;