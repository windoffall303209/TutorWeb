const dbPromise = require("../config/db");

async function seedData() {
  try {
    const db = await dbPromise;

    // Thêm dữ liệu mẫu cho bảng grades
    const grades = [
      "Lớp 1",
      "Lớp 2",
      "Lớp 3",
      "Lớp 4",
      "Lớp 5",
      "Lớp 6",
      "Lớp 7",
      "Lớp 8",
      "Lớp 9",
      "Lớp 10",
      "Lớp 11",
      "Lớp 12",
    ];

    for (const grade of grades) {
      await db.query("INSERT IGNORE INTO grades (name) VALUES (?)", [grade]);
    }

    // Thêm dữ liệu mẫu cho bảng subjects
    const subjects = [
      "Toán",
      "Vật Lý",
      "Hóa Học",
      "Sinh Học",
      "Ngữ Văn",
      "Lịch Sử",
      "Địa Lý",
      "Tiếng Anh",
      "Tin Học",
      "Công Nghệ",
      "GDCD",
      "Thể Dục",
      "Âm Nhạc",
      "Mỹ Thuật",
    ];

    for (const subject of subjects) {
      await db.query("INSERT IGNORE INTO subjects (name) VALUES (?)", [
        subject,
      ]);
    }

    console.log("Seed data completed successfully!");
  } catch (err) {
    console.error("Error during seeding:", err);
  } finally {
    process.exit();
  }
}

seedData();
