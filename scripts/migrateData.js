const dbPromise = require("../config/db");

async function migrateData() {
  try {
    const db = await dbPromise;

    // Lấy tất cả các grade và subject duy nhất từ bảng classes cũ
    const [uniqueGrades] = await db.query(`
      SELECT DISTINCT grade FROM classes WHERE grade IS NOT NULL
    `);
    const [uniqueSubjects] = await db.query(`
      SELECT DISTINCT subject FROM classes WHERE subject IS NOT NULL
    `);

    // Thêm các grade vào bảng grades
    for (const grade of uniqueGrades) {
      await db.query("INSERT IGNORE INTO grades (name) VALUES (?)", [
        grade.grade,
      ]);
    }

    // Thêm các subject vào bảng subjects
    for (const subject of uniqueSubjects) {
      await db.query("INSERT IGNORE INTO subjects (name) VALUES (?)", [
        subject.subject,
      ]);
    }

    // Cập nhật bảng classes với các foreign key mới
    const [classes] = await db.query("SELECT * FROM classes");
    for (const classObj of classes) {
      // Lấy id của grade và subject tương ứng
      const [grade] = await db.query("SELECT id FROM grades WHERE name = ?", [
        classObj.grade,
      ]);
      const [subject] = await db.query(
        "SELECT id FROM subjects WHERE name = ?",
        [classObj.subject]
      );

      if (grade.length && subject.length) {
        await db.query(
          "UPDATE classes SET grade_id = ?, subject_id = ? WHERE id = ?",
          [grade[0].id, subject[0].id, classObj.id]
        );
      }
    }

    console.log("Migration completed successfully!");
  } catch (err) {
    console.error("Error during migration:", err);
  } finally {
    process.exit();
  }
}

migrateData();
