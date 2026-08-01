const ensureActiveUser = (req, res, next) => {
  if (!req.user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated',
      data: null,
      errors: null,
    });
  }

  next();
};

module.exports = {
  ensureActiveUser,
};
