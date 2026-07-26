const { body, param } = require('express-validator');

const getServiceRequestByIdValidator = () => [
  param('id')
    .isMongoId()
    .withMessage('Invalid service request ID format'),
];

const createServiceRequestValidator = [
  body('shopId')
    .exists()
    .withMessage('shopId is required')
    .bail()
    .isMongoId()
    .withMessage('shopId must be a valid ID'),

  body('vehicleType')
    .notEmpty().withMessage('vehicleType is required')
    .bail()
    .isIn(['two_wheeler', 'four_wheeler'])
    .withMessage('vehicleType must be either two_wheeler or four_wheeler'),

  body('issueDescription')
    .trim()
    .notEmpty().withMessage('issueDescription is required')
    .bail()
    .isLength({ min: 5, max: 500 })
    .withMessage('issueDescription must be between 5 and 500 characters'),

  body('location')
    .exists()
    .withMessage('location is required')
    .bail()
    .isObject()
    .withMessage('location must be an object'),

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
];

const quoteServiceRequestValidator = [
  ...getServiceRequestByIdValidator(),

  body('estimatedCost')
    .notEmpty().withMessage('estimatedCost is required')
    .bail()
    .isFloat({ min: 0 })
    .withMessage('estimatedCost must be a number greater than or equal to 0'),

  body('estimatedDuration')
    .trim()
    .notEmpty().withMessage('estimatedDuration is required')
    .bail()
    .isLength({ max: 50 })
    .withMessage('estimatedDuration must be under 50 characters'),

  body('mechanicNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('mechanicNotes must be under 500 characters'),
];

const rejectServiceRequestValidator = [
  ...getServiceRequestByIdValidator(),

  body('mechanicNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('mechanicNotes must be under 500 characters'),
];

const acceptServiceRequestValidator = [...getServiceRequestByIdValidator()];

const cancelServiceRequestValidator = [...getServiceRequestByIdValidator()];

const startServiceRequestValidator = [...getServiceRequestByIdValidator()];

const completeServiceRequestValidator = [...getServiceRequestByIdValidator()];

module.exports = {
  getServiceRequestByIdValidator,
  createServiceRequestValidator,
  quoteServiceRequestValidator,
  rejectServiceRequestValidator,
  acceptServiceRequestValidator,
  cancelServiceRequestValidator,
  startServiceRequestValidator,
  completeServiceRequestValidator,
};