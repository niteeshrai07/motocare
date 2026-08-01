const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth.middleware');
const { ensureActiveUser } = require('../middleware/account.middleware');
const handleValidationErrors = require('../middleware/validation.middleware');

const {
  updateProfileValidator,
  changePasswordValidator,
} = require('../validators/profile.validator');

const {
  getMyProfile,
  updateMyProfile,
  changePassword,
  deactivateAccount,
} = require('../controllers/profile.controller');

router.get('/', verifyToken, ensureActiveUser, getMyProfile);

router.patch(
  '/',
  verifyToken,
  ensureActiveUser,
  updateProfileValidator,
  handleValidationErrors,
  updateMyProfile
);

router.patch(
  '/password',
  verifyToken,
  ensureActiveUser,
  changePasswordValidator,
  handleValidationErrors,
  changePassword
);

router.patch(
  '/deactivate',
  verifyToken,
  ensureActiveUser,
  deactivateAccount
);

module.exports = router;
