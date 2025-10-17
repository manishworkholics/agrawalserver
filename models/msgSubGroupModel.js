// App ke top ki categories heeeee
// models/Student.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config'); // adjust this according to your project structure
const groupModel = require('./msgGroupModel');
// require('./associations');

// Define the Student model
const subGroupModel = sequelize.define('msg_sgroup_mst', {
  msg_sgroup_id  : {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  msg_sgroup_name: {
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
  msg_group_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  }, 
  createdAt: {
    type: DataTypes.DATE, // Use DATE type for timestamps
    allowNull: false,     // Set createdAt to be required
    defaultValue: DataTypes.NOW, // Automatically set to current time if not provided
  },
  updatedAt: {
    type: DataTypes.DATE, // Use DATE type for timestamps
    allowNull: true,     // Set updatedAt to be required
    defaultValue: DataTypes.NOW, // Automatically set to current time if not provided
  },
  is_deleted : {
    type: DataTypes.INTEGER,
    defaultValue:0
  }, 
}, {
  tableName: 'msg_sgroup_mst', 
   timestamps: true,
});
// Define the association (SubGroup belongs to Group)
// Define the association
//subGroupModel.belongsTo(groupModel, { foreignKey: 'msg_group_id' });
module.exports = subGroupModel;