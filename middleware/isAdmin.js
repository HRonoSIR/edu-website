function isAdmin(req, res, next) {
    // Проверяем, что в сессии есть пользователь с ролью "admin"
    if (req.session && req.session.user && req.session.user.role === 'admin') {
      return next();
    }
    res.redirect('/admin/login');
  }
  
  module.exports = isAdmin;
  
