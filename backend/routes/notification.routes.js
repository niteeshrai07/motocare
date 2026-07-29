const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth.middleware');
const handleValidationErrors = require('../middleware/validation.middleware');

const {
  listNotificationsValidator,
  getNotificationByIdValidator,
} = require('../validators/notification.validator');

const {
  getMyNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  archiveNotification,
} = require('../controllers/notification.controller');

router.get(
  '/',
  verifyToken,
  listNotificationsValidator,
  handleValidationErrors,
  getMyNotifications
);

router.get(
  '/:id',
  verifyToken,
  getNotificationByIdValidator,
  handleValidationErrors,
  getNotificationById
);

router.patch(
  '/:id/read',
  verifyToken,
  getNotificationByIdValidator,
  handleValidationErrors,
  markAsRead
);

router.patch(
  '/read-all',
  verifyToken,
  handleValidationErrors,
  markAllAsRead
);

router.delete(
  '/:id',
  verifyToken,
  getNotificationByIdValidator,
  handleValidationErrors,
  archiveNotification
);

module.exports = router;
