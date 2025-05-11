const db = require("../config/db");

module.exports = {
  findByUsername: (username, callback) => {
    db.query("SELECT * FROM users WHERE username = ?", [username], callback);
  },
  create: (userData, callback) => {
    db.query("INSERT INTO users SET ?", userData, callback);
  },
};
