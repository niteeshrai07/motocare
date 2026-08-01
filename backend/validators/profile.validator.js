const { body } = require('express-validator');
const { phoneValidator } = require('./common.validator');

const updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('name must be between 1 and 100 characters'),

  phoneValidator({ required: false }),

  body()
    .custom((bodyValue) => {
      const allowed = ['name', 'phone'];
      const unknown = Object.keys(bodyValue).filter((key) => !allowed.includes(key));
      if (unknown.length > 0) {
        throw new Error(`Unknown fields: ${unknown.join(', ')}`);
      }
      return true;
    }),
];

const changePasswordValidator = [
  body('currentPassword')
    .notEmpty()
    .withMessage('currentPassword is required'),

    body('newPassword')
    .notEmpty()
    .withMessage('newPassword is required')
    .isLength({ min: 6 })
    .withMessage('newPassword must be at least 6 characters')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('newPassword must be different from currentPassword');
      }
      return true;
    }),

  body()
    .custom((bodyValue) => {
      const allowed = ['currentPassword', 'newPassword'];
      const unknown = Object.keys(bodyValue).filter((key) => !allowed.includes(key));
      if (unknown.length > 0) {
        throw new Error(`Unknown fields: ${unknown.join(', ')}`);
      }
      return true;
    }),
];

module.exports = {
  updateProfileValidator,
  changePasswordValidator,
};
