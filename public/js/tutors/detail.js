function copyLink(link) {
  navigator.clipboard.writeText(link).then(function () {
    const copyMessage = document.getElementById("copy-message");
    copyMessage.style.display = "block";
    copyMessage.classList.add("animate__animated", "animate__fadeIn");

    setTimeout(() => {
      copyMessage.classList.remove("animate__fadeIn");
      copyMessage.classList.add("animate__fadeOut");

      setTimeout(() => {
        copyMessage.style.display = "none";
        copyMessage.classList.remove("animate__fadeOut");
      }, 500);
    }, 2000);
  });
}

// Thêm hiệu ứng lăn chuột
document.addEventListener("DOMContentLoaded", function () {
  const elements = document.querySelectorAll(".animate__fadeIn");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate__animated");
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  elements.forEach((el) => {
    observer.observe(el);
  });
});
