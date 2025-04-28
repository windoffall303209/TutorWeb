// Chat search functionality
document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("user-search");
  const searchButton = searchInput ? searchInput.nextElementSibling : null;
  const userListContainer = document.querySelector(".user-list");
  const userList = userListContainer
    ? userListContainer.querySelector(".list-group")
    : null;

  // Lưu trữ danh sách người dùng ban đầu để khôi phục khi xóa tìm kiếm
  let originalUserListHTML = "";
  if (userList) {
    originalUserListHTML = userList.innerHTML;
  }

  if (searchInput && userList) {
    // Thêm spinner hiển thị khi đang tải
    const loadingSpinner = document.createElement("div");
    loadingSpinner.className = "text-center py-3 loading-spinner d-none";
    loadingSpinner.innerHTML =
      '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tìm kiếm...</span></div>';
    userListContainer.appendChild(loadingSpinner);

    // Thêm nút xóa tìm kiếm
    const searchInputContainer = searchInput.parentElement;
    const clearButton = document.createElement("button");
    clearButton.className = "btn btn-sm btn-link position-absolute end-0 me-5";
    clearButton.innerHTML = '<i class="fas fa-times-circle text-muted"></i>';
    clearButton.style.display = "none";
    clearButton.style.zIndex = "5";
    clearButton.style.background = "none";
    clearButton.style.border = "none";
    clearButton.title = "Xóa tìm kiếm";
    searchInputContainer.style.position = "relative";
    searchInputContainer.appendChild(clearButton);

    // Normalize text để hỗ trợ tìm kiếm tiếng Việt
    function normalizeText(text) {
      return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    }

    // Biến để theo dõi timeout tìm kiếm
    let searchTimeout = null;

    // Xử lý sự kiện khi người dùng nhập vào ô tìm kiếm
    searchInput.addEventListener("input", function () {
      const searchQuery = this.value.trim();

      // Hiển thị/ẩn nút xóa
      clearButton.style.display = searchQuery ? "block" : "none";

      // Hiển thị trạng thái tìm kiếm
      if (searchQuery) {
        searchInput.classList.add("border-primary");
        searchButton.classList.remove("btn-outline-primary");
        searchButton.classList.add("btn-primary");
      } else {
        searchInput.classList.remove("border-primary");
        searchButton.classList.add("btn-outline-primary");
        searchButton.classList.remove("btn-primary");

        // Khôi phục danh sách ban đầu khi trống
        userList.innerHTML = originalUserListHTML;

        // Ẩn thông báo không tìm thấy kết quả nếu có
        const noResultsMsg = document.querySelector(".no-results-message");
        if (noResultsMsg) noResultsMsg.remove();

        return;
      }

      // Clear timeout cũ nếu có
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Set timeout mới để tránh gọi API quá nhiều lần
      searchTimeout = setTimeout(() => {
        // Hiển thị spinner
        loadingSpinner.classList.remove("d-none");

        // Gọi API tìm kiếm người dùng
        fetch(`/chat/search-users?query=${encodeURIComponent(searchQuery)}`)
          .then((response) => {
            if (!response.ok) {
              throw new Error("Lỗi khi tìm kiếm");
            }
            return response.json();
          })
          .then((data) => {
            // Ẩn spinner khi có kết quả
            loadingSpinner.classList.add("d-none");

            // Xử lý kết quả tìm kiếm
            if (data.users && data.users.length > 0) {
              // Cập nhật UI với kết quả tìm kiếm
              updateUserList(data.users, searchQuery);
            } else {
              // Hiển thị thông báo không tìm thấy kết quả
              showNoResultsMessage(searchQuery);
            }
          })
          .catch((error) => {
            console.error("Lỗi tìm kiếm:", error);
            loadingSpinner.classList.add("d-none");

            // Hiển thị thông báo lỗi
            showErrorMessage();
          });
      }, 300); // Đợi 300ms sau khi người dùng ngừng gõ
    });

    // Cập nhật danh sách người dùng từ kết quả tìm kiếm
    function updateUserList(users, searchQuery) {
      // Xóa thông báo không có kết quả nếu có
      const noResultsMsg = document.querySelector(".no-results-message");
      if (noResultsMsg) noResultsMsg.remove();

      // Sắp xếp người dùng: người đã chat trước, người chưa chat sau
      const chatContainer = document.getElementById("chat-container");
      const currentReceiverId = chatContainer
        ? chatContainer.dataset.receiverId
        : null;

      // Tạo HTML cho danh sách người dùng
      let userListHTML = "";

      users.forEach((user) => {
        const isActive = user.id === currentReceiverId;
        const textClass = isActive ? "text-white" : "text-dark";
        const activeClass = isActive ? "active" : "";
        const firstLetter = user.display_name.charAt(0).toUpperCase();

        // Tạo badge cho người đang chat
        const badge = isActive
          ? '<span class="badge bg-light text-primary"><i class="fas fa-comment"></i></span>'
          : "";

        // Highlight phần text tìm kiếm
        const regex = new RegExp(
          `(${searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})`,
          "gi"
        );
        const highlightedName = user.display_name.replace(
          regex,
          '<span class="bg-warning text-dark">$1</span>'
        );

        userListHTML += `
          <li class="list-group-item d-flex justify-content-between align-items-center ${activeClass}">
            <a href="#" class="text-decoration-none ${textClass} d-flex align-items-center" 
               onclick="selectUser('${user.id}', '${user.display_name}', event)">
              <span class="avatar rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center me-2" 
                    style="width: 35px; height: 35px">
                ${firstLetter}
              </span>
              <span>${highlightedName}</span>
            </a>
            ${badge}
          </li>
        `;
      });

      // Cập nhật danh sách
      userList.innerHTML = userListHTML;
    }

    // Hiển thị thông báo không tìm thấy kết quả
    function showNoResultsMessage(searchQuery) {
      // Xóa thông báo cũ nếu có
      const existingMsg = document.querySelector(".no-results-message");
      if (existingMsg) existingMsg.remove();

      // Tạo thông báo mới
      const messageElement = document.createElement("div");
      messageElement.className =
        "no-results-message text-center py-3 text-muted";
      messageElement.innerHTML = `
        <i class="fas fa-search me-2"></i>
        Không tìm thấy người dùng với tên "<strong>${searchQuery}</strong>"
      `;

      // Xóa danh sách hiện tại và thêm thông báo
      userList.innerHTML = "";
      userListContainer.appendChild(messageElement);
    }

    // Hiển thị thông báo lỗi
    function showErrorMessage() {
      // Xóa thông báo cũ nếu có
      const existingMsg = document.querySelector(
        ".no-results-message, .error-message"
      );
      if (existingMsg) existingMsg.remove();

      // Tạo thông báo lỗi
      const messageElement = document.createElement("div");
      messageElement.className = "error-message text-center py-3 text-danger";
      messageElement.innerHTML = `
        <i class="fas fa-exclamation-circle me-2"></i>
        Đã xảy ra lỗi khi tìm kiếm. Vui lòng thử lại.
      `;

      userListContainer.appendChild(messageElement);
    }

    // Xử lý nút tìm kiếm
    if (searchButton) {
      searchButton.addEventListener("click", function () {
        const event = new Event("input");
        searchInput.dispatchEvent(event);
      });
    }

    // Xử lý nút xóa tìm kiếm
    clearButton.addEventListener("click", function () {
      searchInput.value = "";
      clearButton.style.display = "none";
      searchInput.classList.remove("border-primary");
      searchButton.classList.add("btn-outline-primary");
      searchButton.classList.remove("btn-primary");

      // Khôi phục danh sách ban đầu
      userList.innerHTML = originalUserListHTML;

      // Xóa thông báo nếu có
      const message = document.querySelector(
        ".no-results-message, .error-message"
      );
      if (message) message.remove();

      // Focus lại vào ô tìm kiếm
      searchInput.focus();
    });

    // Xử lý phím ESC
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        // Nếu đang có nội dung tìm kiếm, xóa nội dung
        if (this.value.trim()) {
          searchInput.value = "";
          clearButton.style.display = "none";
          searchInput.classList.remove("border-primary");
          searchButton.classList.add("btn-outline-primary");
          searchButton.classList.remove("btn-primary");

          // Khôi phục danh sách ban đầu
          userList.innerHTML = originalUserListHTML;

          // Xóa thông báo nếu có
          const message = document.querySelector(
            ".no-results-message, .error-message"
          );
          if (message) message.remove();
        }
        // Nếu đã trống, bỏ focus khỏi ô tìm kiếm
        else {
          searchInput.blur();
        }
      }
    });

    // Phím tắt để focus vào ô tìm kiếm (phím /)
    document.addEventListener("keydown", function (e) {
      if (
        e.key === "/" &&
        document.activeElement.tagName !== "INPUT" &&
        document.activeElement.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }
});
