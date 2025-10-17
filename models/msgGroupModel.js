// App ke top ki categories heeeee
// models/Student.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config'); // adjust this according to your project structure
const subGroupModel = require('./msgSubGroupModel'); // Adjust the path accordingly

// Define the Student model
const groupModel = sequelize.define('msg_group_mst', {
  msg_group_id : {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  msg_group_name: {
    type: DataTypes.STRING,
    allowNull: true,
  }, 
  is_active: {
    type: DataTypes.STRING,
    allowNull: true,
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
   is_deleted : {
    type: DataTypes.INTEGER,
    defaultValue:0
  }, 
}, {
  tableName: 'msg_group_mst', 
   timestamps: false,
});

// Define the association (Group has many SubGroups)
// groupModel has many subgroups

//groupModel.hasMany(subGroupModel, { foreignKey: 'msg_group_id' });
module.exports = groupModel;