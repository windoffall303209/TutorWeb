// Để trống hoặc thêm logic phía client nếu cần
console.log("Client-side script loaded");

// Lắng nghe sự kiện cuộn trang
document.addEventListener("DOMContentLoaded", function () {
  const topBar = document.querySelector(".cus-top-bar");
  const navbar = document.querySelector(".navbar");
  const body = document.body;
  let lastScrollTop = 0;
  let ticking = false;

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        let currentScrollTop =
          window.pageYOffset || document.documentElement.scrollTop;

        if (currentScrollTop > 50) {
          // Cuộn xuống
          topBar.classList.add("hidden");
          navbar.classList.add("compact");
          body.classList.add("compact");
        } else {
          // Cuộn lên
          topBar.classList.remove("hidden");
          navbar.classList.remove("compact");
          body.classList.remove("compact");
        }

        lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
        ticking = false;
      });

      ticking = true;
    }
  });

  // Đảm bảo các nút trong navbar vẫn hoạt động
  document.querySelectorAll(".navbar .nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const href = link.getAttribute("href");
      window.location.href = href;
    });
  });
});

import locations from "/js/locations.js";

document.addEventListener("DOMContentLoaded", () => {
  // Lấy các phần tử
  const tutorRegisterBtn = document.getElementById("tutorRegisterBtn");
  const classRegisterBtn = document.getElementById("classRegisterBtn");
  const tutorForm = document.getElementById("tutorForm");
  const classForm = document.getElementById("classForm");
  const closeButtons = document.querySelectorAll(".close-form-btn");

  // Hiển thị form đăng ký làm gia sư
  if (tutorRegisterBtn) {
    tutorRegisterBtn.addEventListener("click", () => {
      tutorForm.classList.remove("d-none"); // Hiển thị form
      classForm.classList.add("d-none"); // Ẩn form khác
    });
  }

  // Hiển thị form đăng ký tìm gia sư
  if (classRegisterBtn) {
    classRegisterBtn.addEventListener("click", () => {
      classForm.classList.remove("d-none"); // Hiển thị form
      tutorForm.classList.add("d-none"); // Ẩn form khác
    });
  }

  // Đóng form khi nhấp vào nút "X"
  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const formId = button.getAttribute("data-form"); // Lấy ID form cần đóng
      const form = document.getElementById(formId);
      form.classList.add("d-none"); // Ẩn form
    });
  });

  // Hàm tạo danh sách thành phố
  function populateProvinces(provinceSelectId) {
    const provinceSelect = document.getElementById(provinceSelectId);
    if (provinceSelect) {
      for (const province in locations) {
        const option = document.createElement("option");
        option.value = province;
        option.textContent = province;
        provinceSelect.appendChild(option);
      }
    }
  }

  // Hàm tạo danh sách quận theo thành phố đã chọn
  function populateDistricts(provinceSelectId, districtSelectId) {
    const provinceSelect = document.getElementById(provinceSelectId);
    const districtSelect = document.getElementById(districtSelectId);
    if (districtSelect) {
      districtSelect.innerHTML = ""; // Xóa các quận cũ

      if (provinceSelect && locations[provinceSelect.value]) {
        const districts = locations[provinceSelect.value];
        districts.forEach((district) => {
          const option = document.createElement("option");
          option.value = district;
          option.textContent = district;
          districtSelect.appendChild(option);
        });
      }
    }
  }

  // Lắng nghe sự thay đổi của thành phố cho cả hai form
  const provinceSelects = document.querySelectorAll("select[id^='province']");
  provinceSelects.forEach((provinceSelect) => {
    provinceSelect.addEventListener("change", function () {
      const formId = this.closest("form").id;
      const districtSelectId =
        formId === "tutorForm" ? "district" : "districtClass";
      populateDistricts(this.id, districtSelectId);
    });
  });

  // Khởi tạo thành phố và quận mặc định cho cả hai form
  window.onload = function () {
    populateProvinces("province");
    populateProvinces("provinceClass");
    populateDistricts("province", "district");
    populateDistricts("provinceClass", "districtClass");
  };
});
