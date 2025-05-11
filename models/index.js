const User = require("./user");
const Tutor = require("./tutor");
const Class = require("./class");
const Message = require("./message");
const { setupAssociations } = require("./associations");

// Setup associations
setupAssociations();

module.exports = {
  User,
  Tutor,
  Class,
  Message,
};
