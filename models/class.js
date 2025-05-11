const db = require("../config/db");

module.exports = {
  getAllOpen: (limit, offset, callback) => {
    db.query(
      'SELECT * FROM classes WHERE status = "open" LIMIT ? OFFSET ?',
      [limit, offset],
      callback
    );
  },
  getById: (id, callback) => {
    db.query("SELECT * FROM classes WHERE id = ?", [id], callback);
  },
  create: (classData, callback) => {
    db.query("INSERT INTO classes SET ?", classData, callback);
  },
  getCountOpen: (callback) => {
    db.query(
      'SELECT COUNT(*) as total FROM classes WHERE status = "open"',
      callback
    );
  },
};
