const roleMiddleware = (allowedRoles = []) => (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Token de autenticação necessário' });
    }

    const userRole = req.user.role.trim().toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map(role => role.trim().toLowerCase());

    if (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    }
    return next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

const adminOnly = roleMiddleware(['Admin']);
const professorOrAdmin = roleMiddleware(['Admin', 'Professor']);

module.exports = { roleMiddleware, adminOnly, professorOrAdmin };
