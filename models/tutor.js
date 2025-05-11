const db = require("../config/db");

module.exports = {
  getAll: (limit, offset, callback) => {
    db.query(
      "SELECT * FROM tutors LIMIT ? OFFSET ?",
      [limit, offset],
      callback
    );
  },
  getById: (id, callback) => {
    db.query("SELECT * FROM tutors WHERE id = ?", [id], callback);
  },
  create: (tutorData, callback) => {
    db.query("INSERT INTO tutors SET ?", tutorData, callback);
  },
  getCount: (callback) => {
    db.query("SELECT COUNT(*) as total FROM tutors", callback);
  },
};
