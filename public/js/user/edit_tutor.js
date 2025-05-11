document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("tutorForm");

  // Kiểm tra xem có ít nhất một môn học và một lớp học được chọn
  function validateCheckboxGroups() {
    const subjectChecked =
      document.querySelectorAll('input[name="subjects[]"]:checked').length > 0;
    const gradeChecked =
      document.querySelectorAll('input[name="grades[]"]:checked').length > 0;

    if (!subjectChecked) {
      document.querySelectorAll('input[name="subjects[]"]').forEach((cb) => {
        cb.classList.add("is-invalid");
      });
    } else {
      document.querySelectorAll('input[name="subjects[]"]').forEach((cb) => {
        cb.classList.remove("is-invalid");
      });
    }

    if (!gradeChecked) {
      document.querySelectorAll('input[name="grades[]"]').forEach((cb) => {
        cb.classList.add("is-invalid");
      });
    } else {
      document.querySelectorAll('input[name="grades[]"]').forEach((cb) => {
        cb.classList.remove("is-invalid");
      });
    }

    return subjectChecked && gradeChecked;
  }

  form.addEventListener("submit", function (event) {
    const formValid = form.checkValidity();
    const checkboxesValid = validateCheckboxGroups();

    if (!formValid || !checkboxesValid) {
      event.preventDefault();
      event.stopPropagation();
    }

    form.classList.add("was-validated");
  });
});
