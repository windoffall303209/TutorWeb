// Xử lý hiển thị form đăng ký
document.addEventListener("DOMContentLoaded", function () {
  const tutorRegisterBtn = document.getElementById("tutorRegisterBtn");
  const classRegisterBtn = document.getElementById("classRegisterBtn");

  if (tutorRegisterBtn && classRegisterBtn) {
    tutorRegisterBtn.addEventListener("click", function () {
      document.getElementById("tutorForm").classList.remove("d-none");
      document.getElementById("classForm").classList.add("d-none");

      // Thêm hiệu ứng animation
      const formContainer = document.getElementById("tutorForm");
      formContainer.classList.add("animate__animated", "animate__fadeIn");

      // Cuộn xuống form
      formContainer.scrollIntoView({ behavior: "smooth" });
    });

    classRegisterBtn.addEventListener("click", function () {
      document.getElementById("classForm").classList.remove("d-none");
      document.getElementById("tutorForm").classList.add("d-none");

      // Thêm hiệu ứng animation
      const formContainer = document.getElementById("classForm");
      formContainer.classList.add("animate__animated", "animate__fadeIn");

      // Cuộn xuống form
      formContainer.scrollIntoView({ behavior: "smooth" });
    });
  }

  // Xử lý đánh giá sao
  const stars = document.querySelectorAll(".star-rating");
  if (stars.length > 0) {
    stars.forEach((star) => {
      star.addEventListener("click", function () {
        const value = this.dataset.value;

        // Reset tất cả sao về trạng thái không active
        stars.forEach((s) => {
          s.classList.remove("active");
          s.classList.replace("fas", "far");
        });

        // Đánh dấu các sao được chọn là active
        for (let i = 0; i < value; i++) {
          stars[i].classList.add("active");
          stars[i].classList.replace("far", "fas");
        }

        // Hiển thị thông báo cảm ơn
        const thankMessage = document.getElementById("thank-message");
        thankMessage.style.display = "block";
        thankMessage.classList.add("animate__animated", "animate__fadeIn");

        setTimeout(() => {
          thankMessage.classList.remove("animate__fadeIn");
          thankMessage.classList.add("animate__fadeOut");

          setTimeout(() => {
            thankMessage.style.display = "none";
            thankMessage.classList.remove("animate__fadeOut");
          }, 500);
        }, 2000);
      });

      // Hiệu ứng hover cho các sao
      star.addEventListener("mouseover", function () {
        const value = this.dataset.value;

        // Hiển thị hover cho các sao từ 1 đến value
        for (let i = 0; i < value; i++) {
          stars[i].classList.add("hover");
        }
      });

      star.addEventListener("mouseout", function () {
        stars.forEach((s) => s.classList.remove("hover"));
      });
    });
  }
});
