const { query, param } = require('express-validator');

const MAX_ADMIN_LIMIT = 100;

const listUsersValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: MAX_ADMIN_LIMIT })
    .withMessage(`limit must be between 1 and ${MAX_ADMIN_LIMIT}`)
    .toInt(),

  query('role')
    .optional()
    .isIn(['customer', 'mechanic', 'admin'])
    .withMessage('role must be either customer, mechanic, or admin'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('search must be under 100 characters'),

  query('sort')
    .optional()
    .isIn(['newest', 'oldest'])
    .withMessage('sort must be one of newest or oldest'),
];

const getUserIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID format'),
];

const listRepairShopsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: MAX_ADMIN_LIMIT })
    .withMessage(`limit must be between 1 and ${MAX_ADMIN_LIMIT}`)
    .toInt(),

  query('status')
    .optional()
    .isIn(['pending', 'verified', 'rejected'])
    .withMessage('status must be either pending, verified, or rejected'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('search must be under 100 characters'),

  query('sort')
    .optional()
    .isIn(['newest', 'oldest'])
    .withMessage('sort must be one of newest or oldest'),
];

const getRepairShopIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid repair shop ID format'),
];

const listServiceRequestsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: MAX_ADMIN_LIMIT })
    .withMessage(`limit must be between 1 and ${MAX_ADMIN_LIMIT}`)
    .toInt(),

  query('status')
    .optional()
    .isIn([
      'pending',
      'quoted',
      'accepted',
      'in_progress',
      'completed',
      'rejected',
      'cancelled',
      'expired',
    ])
    .withMessage('status is not valid'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('search must be under 100 characters'),

  query('sort')
    .optional()
    .isIn(['newest', 'oldest'])
    .withMessage('sort must be one of newest or oldest'),
];

const getServiceRequestIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid service request ID format'),
];

const listReviewsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: MAX_ADMIN_LIMIT })
    .withMessage(`limit must be between 1 and ${MAX_ADMIN_LIMIT}`)
    .toInt(),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('search must be under 100 characters'),

  query('sort')
    .optional()
    .isIn(['newest', 'oldest', 'highest', 'lowest'])
    .withMessage('sort must be one of newest, oldest, highest, or lowest'),
];

const getReviewIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid review ID format'),
];

module.exports = {
  listUsersValidator,
  getUserIdValidator,
  listRepairShopsValidator,
  getRepairShopIdValidator,
  listServiceRequestsValidator,
  getServiceRequestIdValidator,
  listReviewsValidator,
  getReviewIdValidator,
};
