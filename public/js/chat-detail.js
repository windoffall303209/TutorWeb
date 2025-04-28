document.addEventListener("DOMContentLoaded", () => {
  const chatContainer = document.getElementById("chat-container");
  const userId = String(chatContainer.dataset.userId); // Ép kiểu thành chuỗi
  let currentReceiverId = chatContainer.dataset.receiverId;
  let currentReceiverDisplayName = chatContainer.dataset.receiverName;

  if (currentReceiverId) {
    initializeChat(
      userId,
      currentReceiverId,
      currentReceiverDisplayName,
      currentReceiverId
    );
  }

  window.selectUser = function (receiverId, receiverDisplayName, event) {
    event.preventDefault();
    if (receiverId !== currentReceiverId) {
      currentReceiverId = receiverId;
      currentReceiverDisplayName = receiverDisplayName;

      window.history.pushState({}, "", `/chat?receiverId=${receiverId}`);

      fetch(`/chat/messages?senderId=${userId}&receiverId=${receiverId}`)
        .then((response) => response.json())
        .then((data) => {
          chatContainer.innerHTML = `
            <h2><span id="receiver-name">${receiverDisplayName}</span></h2>
            <div id="chat-box" class="border rounded p-3 mb-3" style="height: 330px; overflow-y: auto;">
                ${data.messages
                  .map(
                    (msg) => `
                    ${
                      String(msg.sender_id) === userId
                        ? `
                        <p class="mb-2 sender-message">
                            <span class="chat-message bg-primary text-white p-2 rounded d-inline-block" style="max-width: 45%;">
                                ${msg.message}
                            </span>
                        </p>
                    `
                        : `
                        <p class="mb-2 receiver-message">
                            <span class="chat-message bg-secondary text-white p-2 rounded d-inline-block" style="max-width: 45%;">
                                ${msg.message}
                            </span>
                        </p>
                    `
                    }
                `
                  )
                  .join("")}
            </div>
            <div class="input-group">
                <textarea id="message-input" class="form-control" placeholder="Nhập tin nhắn" rows="2" style="resize: vertical;"></textarea>
                <button id="send-button" class="btn btn-primary">Gửi</button>
            </div>
          `;
          initializeChat(
            userId,
            receiverId,
            receiverDisplayName,
            currentReceiverId
          );

          const userItems = document.querySelectorAll(
            ".col-md-3 .list-group-item"
          );
          userItems.forEach((item) => {
            const link = item.querySelector("a");
            const userIdMatch = link.onclick.toString().match(/'(\d+)'/);
            if (userIdMatch && userIdMatch[1] === currentReceiverId) {
              if (!item.querySelector(".badge")) {
                const badge = document.createElement("span");
                badge.className = "badge bg-primary rounded-pill";
                badge.textContent = "Chat";
                item.appendChild(badge);
              }
            } else {
              const badge = item.querySelector(".badge");
              if (badge) badge.remove();
            }
          });
        })
        .catch((err) => console.error("Error fetching messages:", err));
    }
  };
});
