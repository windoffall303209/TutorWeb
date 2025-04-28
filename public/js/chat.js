console.log("chat.js loaded");
function initializeChat(
  userId,
  receiverId,
  receiverDisplayName,
  currentReceiverId
) {
  console.log(
    "Initializing chat with userId:",
    userId,
    "receiverId:",
    receiverId
  );
  const socket = io();

  // Tham gia phòng chat
  socket.emit("joinChat", { senderId: userId, receiverId: receiverId });
  console.log("Joined chat room:", `chat-${userId}-${receiverId}`);

  const sendButton = document.getElementById("send-button");
  const messageInput = document.getElementById("message-input");

  if (!sendButton || !messageInput) {
    console.error("Send button or message input not found");
    return;
  }

  // Xóa sự kiện cũ nếu có
  sendButton.removeEventListener("click", sendMessage);
  messageInput.removeEventListener("keydown", sendMessageOnEnter);

  // Hàm gửi tin nhắn
  function sendMessage() {
    const message = messageInput.value;
    console.log("Send triggered");
    if (message.trim()) {
      console.log("Sending message:", message);
      socket.emit("sendMessage", {
        senderId: userId,
        receiverId: receiverId,
        message,
      });
      messageInput.value = "";

      // Tự động hiển thị tin nhắn vừa gửi
      const chatBox = document.getElementById("chat-box");
      const currentTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const newMessage = document.createElement("div");
      newMessage.className = "sender-message";
      newMessage.innerHTML = `
        <div class="chat-message">
          ${message}
          <span class="message-time">${currentTime}</span>
        </div>
      `;

      chatBox.appendChild(newMessage);
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }

  // Hàm gửi tin nhắn khi nhấn Enter
  function sendMessageOnEnter(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  // Sự kiện click nút "Gửi"
  sendButton.addEventListener("click", sendMessage);

  // Sự kiện nhấn phím Enter
  messageInput.addEventListener("keydown", sendMessageOnEnter);

  // Xóa listener Socket.IO cũ trước khi gắn mới
  socket.off("receiveMessage");
  socket.on("receiveMessage", (data) => {
    console.log("Received message:", data);
    if (data.senderId == receiverId || data.receiverId == receiverId) {
      const chatBox = document.getElementById("chat-box");
      const currentTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const newMessage = document.createElement("div");
      if (data.senderId === userId) {
        // Không thêm tin nhắn của người gửi vì đã thêm trong hàm sendMessage
        return;
      } else {
        newMessage.className = "receiver-message";
        newMessage.innerHTML = `
          <div class="chat-message">
            ${data.message}
            <span class="message-time">${currentTime}</span>
          </div>
        `;
      }
      chatBox.appendChild(newMessage);
      chatBox.scrollTop = chatBox.scrollHeight;

      // Thông báo có tin nhắn mới
      notifyNewMessage(data.message);
    }
  });

  // Thông báo có tin nhắn mới
  function notifyNewMessage(message) {
    // Chỉ thông báo nếu tab không focus
    if (!document.hasFocus()) {
      // Kiểm tra quyền thông báo
      if (Notification.permission === "granted") {
        new Notification("Tin nhắn mới", {
          body: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
          icon: "/img/logo.jpg",
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("Tin nhắn mới", {
              body:
                message.substring(0, 50) + (message.length > 50 ? "..." : ""),
              icon: "/img/logo.jpg",
            });
          }
        });
      }
    }
  }

  // Cập nhật danh sách chat realtime
  socket.off("updateChatList");
  socket.on("updateChatList", (chatUsers) => {
    console.log("Updating chat list:", chatUsers);
    console.log("Current receiver ID:", currentReceiverId);
    const userList = document.querySelector(".user-list .list-group");
    if (userList) {
      userList.innerHTML = "";
      if (chatUsers && chatUsers.length > 0) {
        chatUsers.forEach((user, index) => {
          const li = document.createElement("li");
          li.className = `list-group-item d-flex justify-content-between align-items-center ${
            user.id === currentReceiverId ? "active" : ""
          }`;

          li.innerHTML = `
            <a href="#" 
               class="text-decoration-none ${
                 user.id === currentReceiverId ? "text-white" : "text-dark"
               } d-flex align-items-center" 
               onclick="selectUser('${user.id}', '${
            user.display_name
          }', event)">
              <span class="avatar rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center me-2" style="width: 35px; height: 35px">
                ${user.display_name.charAt(0).toUpperCase()}
              </span>
              <span>${user.display_name}</span>
            </a>
            ${
              user.id === currentReceiverId
                ? '<span class="badge bg-light text-primary"><i class="fas fa-comment"></i></span>'
                : ""
            }
          `;
          userList.appendChild(li);
        });
      } else {
        userList.innerHTML = `
          <li class="list-group-item text-muted">
            <i class="fas fa-info-circle me-2"></i>Chưa có cuộc trò chuyện nào.
          </li>
        `;
      }
    } else {
      console.error("User list not found");
    }
  });

  // Cuộn xuống tin nhắn cuối cùng
  const chatBox = document.getElementById("chat-box");
  if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;

  // Tự điều chỉnh chiều cao của textarea
  if (messageInput) {
    messageInput.addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height =
        (this.scrollHeight > 120 ? 120 : this.scrollHeight) + "px";
    });
  }
}

// Yêu cầu quyền thông báo khi trang được tải
document.addEventListener("DOMContentLoaded", function () {
  if (
    Notification.permission !== "granted" &&
    Notification.permission !== "denied"
  ) {
    Notification.requestPermission();
  }
});
