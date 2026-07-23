const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token missing',
      data: null,
      errors: null,
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user no longer exists',
        data: null,
        errors: null,
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token invalid or expired',
      data: null,
      errors: null,
    });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
        data: null,
        errors: null,
      });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  authorizeRoles,
};