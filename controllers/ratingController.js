const dbPromise = require("../config/db");

/**
 * Thêm hoặc cập nhật đánh giá cho gia sư
 */
exports.ratingTutor = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: "Bạn cần đăng nhập để đánh giá gia sư"
      });
    }

    const { tutorId, rating, comment } = req.body;
    const userId = req.session.user.id;
    
    // Kiểm tra đầu vào
    if (!tutorId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Thông tin đánh giá không hợp lệ"
      });
    }

    const db = await dbPromise;

    // Kiểm tra gia sư có tồn tại không
    const [tutors] = await db.query(
      "SELECT * FROM Tutors WHERE id = ? AND is_active = 1",
      [tutorId]
    );

    if (tutors.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin gia sư"
      });
    }

    // Kiểm tra người dùng đã đánh giá gia sư này chưa
    const [existingRatings] = await db.query(
      "SELECT * FROM Tutor_Ratings WHERE tutor_id = ? AND user_id = ?",
      [tutorId, userId]
    );

    if (existingRatings.length > 0) {
      // Cập nhật đánh giá hiện có
      await db.query(
        `UPDATE Tutor_Ratings 
         SET rating = ?, comment = ?, updated_at = CURRENT_TIMESTAMP
         WHERE tutor_id = ? AND user_id = ?`,
        [rating, comment || null, tutorId, userId]
      );

      res.status(200).json({
        success: true,
        message: "Cập nhật đánh giá thành công"
      });
    } else {
      // Thêm đánh giá mới
      await db.query(
        `INSERT INTO Tutor_Ratings (tutor_id, user_id, rating, comment)
         VALUES (?, ?, ?, ?)`,
        [tutorId, userId, rating, comment || null]
      );

      res.status(201).json({
        success: true,
        message: "Thêm đánh giá thành công"
      });
    }

    // Cập nhật điểm đánh giá trung bình (có thể thực hiện trong trigger DB)
  } catch (err) {
    console.error("Lỗi khi đánh giá gia sư:", err);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi đánh giá gia sư"
    });
  }
};

/**
 * Lấy danh sách đánh giá của một gia sư
 */
exports.getTutorRatings = async (req, res) => {
  try {
    const tutorId = req.params.tutorId;
    const db = await dbPromise;

    // Kiểm tra gia sư có tồn tại không
    const [tutors] = await db.query(
      "SELECT * FROM Tutors WHERE id = ?",
      [tutorId]
    );

    if (tutors.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin gia sư"
      });
    }

    // Lấy danh sách đánh giá
    const [ratings] = await db.query(
      `SELECT r.*, u.username, u.display_name
       FROM Tutor_Ratings r
       JOIN Users u ON r.user_id = u.id
       WHERE r.tutor_id = ?
       ORDER BY r.created_at DESC`,
      [tutorId]
    );

    // Tính điểm đánh giá trung bình
    let averageRating = 0;
    if (ratings.length > 0) {
      const sum = ratings.reduce((total, r) => total + r.rating, 0);
      averageRating = (sum / ratings.length).toFixed(1);
    }

    // Tính phân phối điểm đánh giá
    const ratingDistribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };
    
    ratings.forEach(r => {
      ratingDistribution[r.rating]++;
    });

    // Kiểm tra người dùng hiện tại có đánh giá nào không
    let userRating = null;
    if (req.session.user) {
      const [userRatings] = await db.query(
        "SELECT * FROM Tutor_Ratings WHERE tutor_id = ? AND user_id = ?",
        [tutorId, req.session.user.id]
      );
      
      if (userRatings.length > 0) {
        userRating = userRatings[0];
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ratings,
        averageRating,
        totalRatings: ratings.length,
        ratingDistribution,
        userRating
      }
    });
  } catch (err) {
    console.error("Lỗi khi lấy danh sách đánh giá:", err);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách đánh giá"
    });
  }
};

/**
 * Xóa đánh giá của người dùng (chỉ admin)
 */
exports.deleteRating = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện chức năng này"
      });
    }

    const ratingId = req.params.ratingId;
    const db = await dbPromise;

    // Kiểm tra đánh giá có tồn tại không
    const [ratings] = await db.query(
      "SELECT * FROM Tutor_Ratings WHERE id = ?",
      [ratingId]
    );

    if (ratings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá"
      });
    }

    // Xóa đánh giá
    await db.query(
      "DELETE FROM Tutor_Ratings WHERE id = ?",
      [ratingId]
    );

    res.status(200).json({
      success: true,
      message: "Đã xóa đánh giá thành công"
    });
  } catch (err) {
    console.error("Lỗi khi xóa đánh giá:", err);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xóa đánh giá"
    });
  }
}; 