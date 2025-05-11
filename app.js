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

const app = express();

// Cấu hình multer để upload ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Đảm bảo đường dẫn views
console.log("Views path:", path.join(__dirname, "views")); // Debug đường dẫn views
app.use(expressLayouts);
app.set("layout", "layouts/main"); // Layout mặc định
console.log(
  "Layout set to:",
  path.join(__dirname, "views", "layouts", "main.ejs")
); // Debug đường dẫn layout
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use("/auth", authRoutes);
app.use("/tutors", tutorRoutes);
app.use("/classes", classRoutes);
app.use("/admin", adminRoutes);

app.get("/", (req, res) => {
  console.log("Rendering intro/index"); // Debug render
  res.render("intro/index", { title: "Giới thiệu", user: req.session.user });
});
app.get("/contact", (req, res) => {
  console.log("Rendering contact/index"); // Debug render
  res.render("contact/index", { title: "Liên hệ", user: req.session.user });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
