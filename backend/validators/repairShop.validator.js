const { body, query, param } = require('express-validator');
const { phoneValidator } = require('./common.validator');

const createRepairShopValidator = [
  // shopName
  body('shopName')
    .trim()
    .notEmpty().withMessage('Shop name is required')
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage('Shop name must be between 2 and 100 characters'),

  // vehicleTypesServiced
  body('vehicleTypesServiced')
    .isArray({ min: 1 })
    .withMessage('vehicleTypesServiced must be a non-empty array'),

  body('vehicleTypesServiced.*')
    .isIn(['two_wheeler', 'four_wheeler'])
    .withMessage('Each vehicle type must be either two_wheeler or four_wheeler'),

  // location
  body('location')
    .isObject()
    .withMessage('location is required and must be an object'),

  body('location.type')
    .exists()
    .withMessage('location.type is required')
    .bail()
    .equals('Point')
    .withMessage('location.type must be "Point"'),

  body('location.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('location.coordinates must be an array of exactly two numbers [longitude, latitude]')
    .bail()
    .custom((coords) => {
      const [longitude, latitude] = coords;

      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
        throw new Error('Coordinates must be finite numbers');
      }
      if (longitude < -180 || longitude > 180) {
        throw new Error('Longitude must be between -180 and 180');
      }
      if (latitude < -90 || latitude > 90) {
        throw new Error('Latitude must be between -90 and 90');
      }
      return true;
    }),

  // address
  body('address')
    .trim()
    .notEmpty().withMessage('Address is required')
    .bail()
    .isLength({ max: 300 })
    .withMessage('Address must be under 300 characters'),

  // phone (shared rule, same as User.phone)
  phoneValidator(),

  // description (optional)
  body('description')
    .optional()
    .trim()
    .isString().withMessage('description must be a string')
    .bail()
    .isLength({ max: 1000 })
    .withMessage('description must be under 1000 characters'),

  // openingHours (optional)
  body('openingHours')
    .optional()
    .trim()
    .isString().withMessage('openingHours must be a string')
    .bail()
    .isLength({ max: 100 })
    .withMessage('openingHours must be under 100 characters'),

  // photoUrl (optional)
  body('photoUrl')
    .optional()
    .trim()
    .matches(/^https?:\/\/.+/i)
    .withMessage('photoUrl must be a valid HTTP or HTTPS URL'),
];

const updateRepairShopValidator = [
  body('shopName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Shop name must be between 2 and 100 characters'),

  body('vehicleTypesServiced')
    .optional()
    .isArray({ min: 1 })
    .withMessage('vehicleTypesServiced must be a non-empty array'),

  body('vehicleTypesServiced.*')
    .optional()
    .isIn(['two_wheeler', 'four_wheeler'])
    .withMessage('Each vehicle type must be either two_wheeler or four_wheeler'),

  body('location')
    .optional()
    .isObject()
    .withMessage('location must be an object'),

  body('location.type')
    .optional()
    .equals('Point')
    .withMessage('location.type must be "Point" if provided'),

  body('location.coordinates')
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage('location.coordinates must be an array of exactly two numbers [longitude, latitude]')
    .bail()
    .custom((coords) => {
      const [longitude, latitude] = coords;
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
        throw new Error('Coordinates must be finite numbers');
      }
      if (longitude < -180 || longitude > 180) {
        throw new Error('Longitude must be between -180 and 180');
      }
      if (latitude < -90 || latitude > 90) {
        throw new Error('Latitude must be between -90 and 90');
      }
      return true;
    }),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Address must be under 300 characters'),

  phoneValidator({ required: false }),

  body('description')
    .optional()
    .trim()
    .isString().withMessage('description must be a string')
    .bail()
    .isLength({ max: 1000 })
    .withMessage('description must be under 1000 characters'),

  body('openingHours')
    .optional()
    .trim()
    .isString().withMessage('openingHours must be a string')
    .bail()
    .isLength({ max: 100 })
    .withMessage('openingHours must be under 100 characters'),

  body('photoUrl')
    .optional()
    .trim()
    .matches(/^https?:\/\/.+/i)
    .withMessage('photoUrl must be a valid HTTP or HTTPS URL'),
];

const MAX_LIMIT = 50;

const nearbyShopsValidator = [
  query('lng')
    .exists().withMessage('lng is required')
    .bail()
    .isFloat({ min: -180, max: 180 }).withMessage('lng must be a number between -180 and 180')
    .toFloat(),

  query('lat')
    .exists().withMessage('lat is required')
    .bail()
    .isFloat({ min: -90, max: 90 }).withMessage('lat must be a number between -90 and 90')
    .toFloat(),

  query('radius')
    .optional()
    .isFloat({ gt: 0 }).withMessage('radius must be a positive number')
    .toFloat(),

  query('vehicleType')
    .optional()
    .isIn(['two_wheeler', 'four_wheeler'])
    .withMessage('vehicleType must be either two_wheeler or four_wheeler'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: MAX_LIMIT }).withMessage(`limit must be between 1 and ${MAX_LIMIT}`)
    .toInt(),
];

const getRepairShopByIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid repair shop ID format'),
];

const getShopIdValidator = [
  param('shopId')
    .isMongoId()
    .withMessage('Invalid shop ID format'),
];

const listRepairShopsValidator = [
  query('status')
    .optional()
    .isIn(['pending', 'verified', 'rejected'])
    .withMessage('status must be one of pending, verified, or rejected'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: MAX_LIMIT }).withMessage(`limit must be between 1 and ${MAX_LIMIT}`)
    .toInt(),
];

const verifyRepairShopStatusValidator = [
  body('status')
    .isIn(['verified', 'rejected'])
    .withMessage('status must be either "verified" or "rejected"'),
];

const MAX_REVIEW_LIMIT = 50;

const listShopReviewsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: MAX_REVIEW_LIMIT }).withMessage(`limit must be between 1 and ${MAX_REVIEW_LIMIT}`)
    .toInt(),

  query('sort')
    .optional()
    .isIn(['newest', 'highest', 'lowest']).withMessage('sort must be one of newest, highest, or lowest'),
];

module.exports = {
  createRepairShopValidator,
  updateRepairShopValidator,
  nearbyShopsValidator,
  getRepairShopByIdValidator,
  getShopIdValidator,
  listRepairShopsValidator,
  verifyRepairShopStatusValidator,
  listShopReviewsValidator,
};