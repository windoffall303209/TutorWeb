const User = require("./user");
const Message = require("./message");

// User associations
User.hasMany(Message, { as: "sentMessages", foreignKey: "sender_id" });
User.hasMany(Message, { as: "receivedMessages", foreignKey: "receiver_id" });

// Message associations
Message.belongsTo(User, { as: "sender", foreignKey: "sender_id" });
Message.belongsTo(User, { as: "receiver", foreignKey: "receiver_id" });

module.exports = {
  setupAssociations: () => {
    // This function will be called after all models are loaded
  },
};
