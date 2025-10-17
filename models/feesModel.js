
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config"); // adjust this according to your project structure

// Define the Student model
const feesDisplayModel = sequelize.define(
  "fees_display",
  {
    fees_display_id : {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    scholar_no: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    session_detail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    term: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    outstandingfees: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    duedate: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    feesstatus: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue:0
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "fees_display",
    timestamps: false,
  }
);

module.exports = feesDisplayModel;
