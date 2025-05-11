const db = require("../config/db");

const authMiddleware = async (req, res, next) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ message: "Unauthorized. Please log in." });
    }

    const [results] = await db.query(
      "SELECT is_active FROM Users WHERE id = ?",
      [req.session.user.id]
    );

    if (!results || results.length === 0 || !results[0].is_active) {
      return res.status(403).json({ message: "Forbidden. User is inactive." });
    }

    req.user = req.session.user; // Gắn thông tin user vào request
    next();
  } catch (error) {
    console.error("Error in authMiddleware:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = authMiddleware;
