const { DataTypes } = require("sequelize");
const db = require("../config/db");

const Message = db.define(
  "Message",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    receiver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "chats",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = Message;
