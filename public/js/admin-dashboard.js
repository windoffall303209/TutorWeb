// User Chart
const userCtx = document.getElementById("userChart").getContext("2d");
new Chart(userCtx, {
  type: "pie",
  data: {
    labels: ["Admin Users", "Active Users", "Inactive Users"],
    datasets: [
      {
        data: [userStats.admin, userStats.active, userStats.inactive],
        backgroundColor: ["#ffcd56", "#36a2eb", "#ff6384"],
      },
    ],
  },
  options: {
    title: {
      display: true,
      text:
        "User Accounts (" +
        (userStats.active + userStats.admin) +
        "/" +
        userStats.total +
        ")",
    },
  },
});

// Class Chart
const classCtx = document.getElementById("classChart").getContext("2d");
new Chart(classCtx, {
  type: "pie",
  data: {
    labels: ["Lớp trống", "Lớp đã nhận"],
    datasets: [
      {
        data: [classStats.available, classStats.occupied],
        backgroundColor: ["#36a2eb", "#ff6384"],
      },
    ],
  },
  options: {
    title: {
      display: true,
      text: "Classes (" + classStats.available + "/" + classStats.total + ")",
    },
  },
});

// Tutor Chart
const tutorCtx = document.getElementById("tutorChart").getContext("2d");
new Chart(tutorCtx, {
  type: "pie",
  data: {
    labels: ["Gia sư đang dạy", "Gia sư đã nghỉ"],
    datasets: [
      {
        data: [tutorStats.active, tutorStats.inactive],
        backgroundColor: ["#36a2eb", "#ff6384"],
      },
    ],
  },
  options: {
    title: {
      display: true,
      text: "Tutors (" + tutorStats.active + "/" + tutorStats.total + ")",
    },
  },
});
