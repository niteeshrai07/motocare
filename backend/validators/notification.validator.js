const { query, param } = require('express-validator');

const MAX_NOTIFICATION_LIMIT = 50;

const listNotificationsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: MAX_NOTIFICATION_LIMIT })
    .withMessage(`limit must be between 1 and ${MAX_NOTIFICATION_LIMIT}`)
    .toInt(),

  query('unreadOnly')
    .optional()
    .isBoolean()
    .withMessage('unreadOnly must be a boolean')
    .toBoolean(),

  query('archived')
    .optional()
    .isBoolean()
    .withMessage('archived must be a boolean')
    .toBoolean(),

  query('sort')
    .optional()
    .isIn(['newest', 'oldest'])
    .withMessage('sort must be one of newest or oldest'),
];

const getNotificationByIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid notification ID format'),
];

module.exports = {
  listNotificationsValidator,
  getNotificationByIdValidator,
};
