const db = require("../config/db");

module.exports = {
  getAll: async () => {
    const [results] = await db.query(
      "SELECT * FROM grades WHERE is_active = 1"
    );
    return results;
  },
  getById: async (id) => {
    const [results] = await db.query("SELECT * FROM grades WHERE id = ?", [id]);
    return results[0];
  },
};
