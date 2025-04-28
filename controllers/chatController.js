const dbPromise = require("../config/db");

exports.index = async (req, res) => {
  try {
    const db = await dbPromise;
    const userId = req.session.user.id;
    const receiverId = req.query.receiverId;

    const [chatUsers] = await db.query(
      `
            SELECT DISTINCT u.id, u.username as display_name, t.photo
            FROM Users u
            INNER JOIN chats c ON (u.id = c.sender_id OR u.id = c.receiver_id)
            LEFT JOIN Tutors t ON u.id = t.user_id
            WHERE (c.sender_id = ? OR c.receiver_id = ?) AND u.id != ?
        `,
      [userId, userId, userId]
    );

    let messages = [];
    let receiver = null;

    if (receiverId) {
      [messages] = await db.query(
        `
                SELECT * FROM Chats 
                WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) 
                ORDER BY created_at
            `,
        [userId, receiverId, receiverId, userId]
      );

      [receiver] = await db.query(
        `
                SELECT u.id, u.username as display_name, t.photo 
                FROM Users u 
                LEFT JOIN Tutors t ON u.id = t.user_id 
                WHERE u.id = ?
            `,
        [receiverId]
      );

      if (!receiver.length) receiver = null;
      else receiver = receiver[0];
    }

    res.render("chat/index", {
      title: "Chat",
      users: chatUsers,
      messages,
      receiver,
      userId,
      user: req.session.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

// Route phụ để trả về tin nhắn dưới dạng JSON
exports.getMessages = async (req, res) => {
  try {
    const db = await dbPromise;
    const userId = req.query.senderId;
    const receiverId = req.query.receiverId;

    const [messages] = await db.query(
      `
            SELECT * FROM Chats 
            WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) 
            ORDER BY created_at
        `,
      [userId, receiverId, receiverId, userId]
    );

    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// API tìm kiếm người dùng theo tên
exports.searchUsers = async (req, res) => {
  try {
    const db = await dbPromise;
    const userId = req.session.user.id;
    const searchQuery = req.query.query || "";

    // Tìm kiếm người dùng dựa trên tên (username)
    const [users] = await db.query(
      `
            SELECT u.id, u.username as display_name, t.photo
            FROM Users u
            LEFT JOIN Tutors t ON u.id = t.user_id
            WHERE u.id != ? AND u.username LIKE ?
            ORDER BY u.username
            LIMIT 30
        `,
      [userId, `%${searchQuery}%`]
    );

    res.json({ users });
  } catch (err) {
    console.error("Lỗi khi tìm kiếm người dùng:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
