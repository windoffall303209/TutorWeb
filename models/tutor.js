const dbPromise = require("../config/db");

class Tutor {
  static async create(tutorData, subjectIds, gradeIds) {
    try {
      const db = await dbPromise;
      const connection = await db.getConnection();

      try {
        await connection.beginTransaction();

        // Thêm thông tin gia sư vào bảng tutors
        const [result] = await connection.query(
          "INSERT INTO tutors SET ?",
          tutorData
        );
        const tutorId = result.insertId;

        // Thêm các môn học vào bảng tutor_subjects
        if (subjectIds && subjectIds.length > 0) {
          const subjectValues = subjectIds.map((subjectId) => [
            tutorId,
            subjectId,
          ]);
          await connection.query(
            "INSERT INTO tutor_subjects (tutor_id, subject_id) VALUES ?",
            [subjectValues]
          );
        }

        // Thêm các khối lớp vào bảng tutor_grades
        if (gradeIds && gradeIds.length > 0) {
          const gradeValues = gradeIds.map((gradeId) => [tutorId, gradeId]);
          await connection.query(
            "INSERT INTO tutor_grades (tutor_id, grade_id) VALUES ?",
            [gradeValues]
          );
        }

        await connection.commit();
        connection.release();
        return tutorId;
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error("Error in Tutor.create:", error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const db = await dbPromise;
      const connection = await db.getConnection();

      try {
        // Lấy thông tin cơ bản của gia sư
        const [tutorRows] = await connection.query(
          "SELECT * FROM tutors WHERE id = ?",
          [id]
        );
        if (tutorRows.length === 0) return null;

        const tutor = tutorRows[0];

        // Lấy danh sách môn học
        const [subjects] = await connection.query(
          `SELECT s.* FROM subjects s 
           INNER JOIN tutor_subjects ts ON s.id = ts.subject_id 
           WHERE ts.tutor_id = ? AND s.is_active = 1`,
          [id]
        );
        tutor.subjects = subjects;

        // Lấy danh sách khối lớp
        const [grades] = await connection.query(
          `SELECT g.* FROM grades g 
           INNER JOIN tutor_grades tg ON g.id = tg.grade_id 
           WHERE tg.tutor_id = ? AND g.is_active = 1`,
          [id]
        );
        tutor.grades = grades;

        connection.release();
        return tutor;
      } catch (error) {
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error("Error in Tutor.getById:", error);
      throw error;
    }
  }

  static async getAll(limit, offset) {
    try {
      const db = await dbPromise;
      const connection = await db.getConnection();

      try {
        // Lấy danh sách gia sư
        const [rows] = await connection.query(
          "SELECT * FROM tutors ORDER BY created_at DESC LIMIT ? OFFSET ?",
          [limit, offset]
        );

        // Lấy thông tin môn học và khối lớp cho mỗi gia sư
        for (let tutor of rows) {
          const [subjects] = await connection.query(
            `SELECT s.* FROM subjects s 
             INNER JOIN tutor_subjects ts ON s.id = ts.subject_id 
             WHERE ts.tutor_id = ? AND s.is_active = 1`,
            [tutor.id]
          );
          tutor.subjects = subjects;

          const [grades] = await connection.query(
            `SELECT g.* FROM grades g 
             INNER JOIN tutor_grades tg ON g.id = tg.grade_id 
             WHERE tg.tutor_id = ? AND g.is_active = 1`,
            [tutor.id]
          );
          tutor.grades = grades;
        }

        connection.release();
        return rows;
      } catch (error) {
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error("Error in Tutor.getAll:", error);
      throw error;
    }
  }

  static async getCount() {
    try {
      const [rows] = await dbPromise.query(
        "SELECT COUNT(*) as count FROM tutors"
      );
      return rows[0].count;
    } catch (error) {
      console.error("Error in Tutor.getCount:", error);
      throw error;
    }
  }

  static async search(filters, limit, offset) {
    try {
      const db = await dbPromise;
      const connection = await db.getConnection();

      try {
        // Xây dựng câu truy vấn cơ bản
        let query = "SELECT * FROM tutors WHERE 1=1";
        const queryParams = [];

        // Thêm điều kiện lọc
        if (filters.gender) {
          query += " AND gender = ?";
          queryParams.push(filters.gender);
        }

        if (filters.education_level) {
          query += " AND education_level = ?";
          queryParams.push(filters.education_level);
        }

        if (filters.district) {
          query += " AND district = ?";
          queryParams.push(filters.district);
        }

        if (filters.province) {
          query += " AND province = ?";
          queryParams.push(filters.province);
        }

        // Thêm sắp xếp và phân trang
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        queryParams.push(limit, offset);

        // Thực hiện truy vấn
        const [rows] = await connection.query(query, queryParams);

        // Lọc theo môn học và khối lớp (cần lấy thêm dữ liệu từ bảng quan hệ)
        const tutors = [];
        for (let tutor of rows) {
          const [subjects] = await connection.query(
            `SELECT s.* FROM subjects s 
             INNER JOIN tutor_subjects ts ON s.id = ts.subject_id 
             WHERE ts.tutor_id = ? AND s.is_active = 1`,
            [tutor.id]
          );
          tutor.subjects = subjects;

          const [grades] = await connection.query(
            `SELECT g.* FROM grades g 
             INNER JOIN tutor_grades tg ON g.id = tg.grade_id 
             WHERE tg.tutor_id = ? AND g.is_active = 1`,
            [tutor.id]
          );
          tutor.grades = grades;

          // Lọc theo môn học (nếu có)
          if (filters.subjects_teach && tutor.subjects.length > 0) {
            const hasSubject = tutor.subjects.some(
              (subject) => subject.id == filters.subjects_teach
            );
            if (!hasSubject) continue;
          }

          // Lọc theo khối lớp (nếu có)
          if (filters.classes_teach && tutor.grades.length > 0) {
            const hasGrade = tutor.grades.some(
              (grade) => grade.id == filters.classes_teach
            );
            if (!hasGrade) continue;
          }

          tutors.push(tutor);
        }

        connection.release();
        return tutors;
      } catch (error) {
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error("Error in Tutor.search:", error);
      throw error;
    }
  }

  static async getSearchCount(filters) {
    try {
      const db = await dbPromise;
      const connection = await db.getConnection();

      try {
        // Xây dựng câu truy vấn đếm cơ bản
        let query = "SELECT COUNT(*) as count FROM tutors WHERE 1=1";
        const queryParams = [];

        // Thêm điều kiện lọc
        if (filters.gender) {
          query += " AND gender = ?";
          queryParams.push(filters.gender);
        }

        if (filters.education_level) {
          query += " AND education_level = ?";
          queryParams.push(filters.education_level);
        }

        if (filters.district) {
          query += " AND district = ?";
          queryParams.push(filters.district);
        }

        if (filters.province) {
          query += " AND province = ?";
          queryParams.push(filters.province);
        }

        // Thực hiện truy vấn đếm
        const [rows] = await connection.query(query, queryParams);
        let count = rows[0].count;

        // Nếu có lọc theo môn học hoặc khối lớp, cần đếm thủ công
        if (filters.subjects_teach || filters.classes_teach) {
          // Lấy tất cả các tutors trước khi lọc theo subjects và grades
          const [allTutors] = await connection.query(query, queryParams);

          const filteredTutors = [];
          for (let tutor of allTutors) {
            const [subjects] = await connection.query(
              `SELECT s.id FROM subjects s 
               INNER JOIN tutor_subjects ts ON s.id = ts.subject_id 
               WHERE ts.tutor_id = ? AND s.is_active = 1`,
              [tutor.id]
            );

            const [grades] = await connection.query(
              `SELECT g.id FROM grades g 
               INNER JOIN tutor_grades tg ON g.id = tg.grade_id 
               WHERE tg.tutor_id = ? AND g.is_active = 1`,
              [tutor.id]
            );

            // Lọc theo môn học
            if (filters.subjects_teach && subjects.length > 0) {
              const hasSubject = subjects.some(
                (subject) => subject.id == filters.subjects_teach
              );
              if (!hasSubject) continue;
            }

            // Lọc theo khối lớp
            if (filters.classes_teach && grades.length > 0) {
              const hasGrade = grades.some(
                (grade) => grade.id == filters.classes_teach
              );
              if (!hasGrade) continue;
            }

            filteredTutors.push(tutor);
          }

          count = filteredTutors.length;
        }

        connection.release();
        return count;
      } catch (error) {
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error("Error in Tutor.getSearchCount:", error);
      throw error;
    }
  }
}

module.exports = Tutor;
