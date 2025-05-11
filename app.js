require("dotenv").config();
const express = require("express");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const authRoutes = require("./routes/auth");
const tutorRoutes = require("./routes/tutor");
const classRoutes = require("./routes/class");
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");
const http = require("http");
const { Server } = require("socket.io");
const dbPromise = require("./config/db");
const { logActivity, logRender, logRedirects, logError, writeToLogFile, addSeparator } = require("./middleware/logger");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Khởi động logger
writeToLogFile("==== SERVER STARTED ====");
console.log("==== SERVER STARTED ====");

// Cấu hình multer để upload ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/main");

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Thêm middleware để vô hiệu hóa cache của trình duyệt
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Middleware để thêm user vào res.locals
app.use((req, res, next) => {
  res.locals.user = req.session?.user;
  next();
});

// Khởi tạo middleware ghi log - sau session để có thông tin người dùng
app.use(logActivity);
app.use(logRender);
app.use(logRedirects);

// Đăng ký routes
app.use("/auth", authRoutes);
app.use("/tutors", tutorRoutes);
app.use("/classes", classRoutes);
app.use("/admin", adminRoutes);
app.use("/user", userRoutes);

// Trang chủ và liên hệ
app.get("/", (req, res) => {
  res.render("intro/index", { title: "Giới thiệu" });
});

app.get("/contact", async (req, res) => {
  try {
    const db = await require("./config/db");
    const [subjects] = await db.query(
      "SELECT * FROM subjects WHERE is_active = 1"
    );
    const [grades] = await db.query("SELECT * FROM grades WHERE is_active = 1");

    res.render("contact/index", {
      title: "Liên hệ",
      subjects: subjects,
      grades: grades,
    });
  } catch (error) {
    console.error("Error getting contact page:", error);
    writeToLogFile("Error getting contact page: " + error.message);
    res
      .status(500)
      .send("Đã có lỗi xảy ra khi tải trang liên hệ. Vui lòng thử lại sau.");
  }
});

// Middleware xử lý lỗi
app.use(logError);

const port = process.env.PORT || 3000;
server.listen(port, () => {
  const message = `Server running on port ${port}`;
  console.log(message);
  writeToLogFile(message);
});
