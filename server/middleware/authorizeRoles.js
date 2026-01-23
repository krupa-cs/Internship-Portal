const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: "Forbidden. No role assigned." });
    }

    const rolesArray = [...allowedRoles];

    if (!rolesArray.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden. Your role (${req.user.role}) is not authorized.` });
    }

    next();
  };
};

module.exports = authorizeRoles;
