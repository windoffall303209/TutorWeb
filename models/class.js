const db = require("../config/db");

module.exports = {
  getAllOpen: async (limit, offset) => {
    const [results] = await db.query(
      `SELECT c.*, s.name as subject_name, g.name as grade_name 
       FROM classes c 
       JOIN subjects s ON c.subject_id = s.id 
       JOIN grades g ON c.grade_id = g.id 
       WHERE c.status = "open" AND c.is_active = 1 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return results;
  },

  getById: async (id) => {
    const [results] = await db.query(
      `SELECT c.*, s.name as subject, g.name as grade,
       t.id as tutor_id, t.full_name as tutor_name, t.phone as tutor_phone, 
       t.address as tutor_address, t.photo as tutor_photo, t.user_id as tutor_user_id
       FROM classes c 
       JOIN subjects s ON c.subject_id = s.id 
       JOIN grades g ON c.grade_id = g.id 
       LEFT JOIN (
         SELECT cr.class_id, cr.tutor_id 
         FROM class_register cr 
         WHERE cr.status = 'accepted'
       ) as cr ON c.id = cr.class_id
       LEFT JOIN tutors t ON cr.tutor_id = t.id
       WHERE c.id = ?`,
      [id]
    );
    return results[0];
  },

  create: async (classData) => {
    const [result] = await db.query("INSERT INTO classes SET ?", classData);
    return result.insertId;
  },

  getCountOpen: async () => {
    const [results] = await db.query(
      'SELECT COUNT(*) as total FROM classes WHERE status = "open" AND is_active = 1'
    );
    return results[0].total;
  },

  search: async (filters, limit, offset) => {
    let query = `SELECT c.*, s.name as subject_name, g.name as grade_name 
                 FROM classes c 
                 JOIN subjects s ON c.subject_id = s.id 
                 JOIN grades g ON c.grade_id = g.id 
                 WHERE c.status = "open" AND c.is_active = 1`;

    const params = [];

    if (filters.subject_id) {
      query += " AND c.subject_id = ?";
      params.push(filters.subject_id);
    }

    if (filters.grade_id) {
      query += " AND c.grade_id = ?";
      params.push(filters.grade_id);
    }

    if (filters.learning_mode && filters.learning_mode !== "all") {
      query += " AND c.learning_mode = ?";
      params.push(filters.learning_mode);
    }

    if (filters.district) {
      query += " AND c.district = ?";
      params.push(filters.district);
    }

    if (filters.province) {
      query += " AND c.province = ?";
      params.push(filters.province);
    }

    query += " LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [results] = await db.query(query, params);
    return results;
  },

  getSearchCount: async (filters) => {
    let query = `SELECT COUNT(*) as total 
                 FROM classes c 
                 WHERE c.status = "open" AND c.is_active = 1`;

    const params = [];

    if (filters.subject_id) {
      query += " AND c.subject_id = ?";
      params.push(filters.subject_id);
    }

    if (filters.grade_id) {
      query += " AND c.grade_id = ?";
      params.push(filters.grade_id);
    }

    if (filters.learning_mode && filters.learning_mode !== "all") {
      query += " AND c.learning_mode = ?";
      params.push(filters.learning_mode);
    }

    if (filters.district) {
      query += " AND c.district = ?";
      params.push(filters.district);
    }

    if (filters.province) {
      query += " AND c.province = ?";
      params.push(filters.province);
    }

    const [results] = await db.query(query, params);
    return results[0].total;
  },
};
