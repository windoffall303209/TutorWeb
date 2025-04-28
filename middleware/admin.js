const checkAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    console.log("Access denied: Not an admin");
    return res.redirect("/auth/login");
  }
  next();
};

module.exports = { checkAdmin };
