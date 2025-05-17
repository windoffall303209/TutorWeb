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
const chatRoutes = require("./routes/chat");
const scheduleRoutes = require("./routes/schedule");
const ratingRoutes = require("./routes/rating");
const http = require("http");
const { Server } = require("socket.io");
const dbPromise = require("./config/db");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Cấu hình multer để upload ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
console.log("Views path:", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/main");
console.log(
  "Layout set to:",
  path.join(__dirname, "views", "layouts", "main.ejs")
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
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
  console.log("Session user:", req.session?.user);
  res.locals.user = req.session?.user;
  next();
});

// Đăng ký routes
app.use("/auth", authRoutes);
app.use("/tutors", tutorRoutes);
app.use("/classes", classRoutes);
app.use("/admin", adminRoutes);
app.use("/user", userRoutes);
app.use("/chat", chatRoutes);
app.use("/schedules", scheduleRoutes);
app.use("/ratings", ratingRoutes);

// Trang chủ và liên hệ
app.get("/", (req, res) => {
  console.log("Rendering intro/index");
  res.render("intro/index", { title: "Giới thiệu" });
});

app.get("/contact", async (req, res) => {
  try {
    console.log("Rendering contact/index");
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
    res
      .status(500)
      .send("Đã có lỗi xảy ra khi tải trang liên hệ. Vui lòng thử lại sau.");
  }
});

// Socket.IO cho chức năng chat realtime
io.on("connection", async (socket) => {
  console.log("A user connected");

  socket.on("joinChat", (data) => {
    const roomName = `chat-${data.senderId}-${data.receiverId}`;
    socket.join(roomName);
    console.log(`User joined room: ${roomName}`);
  });

  socket.on("sendMessage", async (data) => {
    console.log("Message received:", data);
    try {
      const db = await dbPromise;
      await db.query(
        "INSERT INTO Chats (sender_id, receiver_id, message) VALUES (?, ?, ?)",
        [data.senderId, data.receiverId, data.message]
      );

      // Broadcast message to both sender and receiver
      const roomSender = `chat-${data.senderId}-${data.receiverId}`;
      const roomReceiver = `chat-${data.receiverId}-${data.senderId}`;

      io.to(roomSender).to(roomReceiver).emit("receiveMessage", {
        senderId: data.senderId,
        receiverId: data.receiverId,
        message: data.message
      });

      // Update chat list for both users
      const [chatUsers] = await db.query(
        `
        SELECT DISTINCT u.id, u.username as display_name, t.photo
        FROM Users u
        INNER JOIN Chats c ON (u.id = c.sender_id OR u.id = c.receiver_id)
        LEFT JOIN Tutors t ON u.id = t.user_id
        WHERE (c.sender_id = ? OR c.receiver_id = ?) AND u.id != ?
        `,
        [data.senderId, data.senderId, data.senderId]
      );
      
      socket.emit("updateChatList", chatUsers);
      
      // Update chat list for receiver if they're online
      const [receiverChatUsers] = await db.query(
        `
        SELECT DISTINCT u.id, u.username as display_name, t.photo
        FROM Users u
        INNER JOIN Chats c ON (u.id = c.sender_id OR u.id = c.receiver_id)
        LEFT JOIN Tutors t ON u.id = t.user_id
        WHERE (c.sender_id = ? OR c.receiver_id = ?) AND u.id != ?
        `,
        [data.receiverId, data.receiverId, data.receiverId]
      );
      
      io.to(roomReceiver).emit("updateChatList", receiverChatUsers);
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server running on port ${port}`));
