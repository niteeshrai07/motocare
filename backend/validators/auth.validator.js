const { body } = require('express-validator');
const { phoneValidator } = require('./common.validator');

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .bail()
    .isEmail().withMessage('Please enter a valid email address'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .bail()
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  phoneValidator(),

  body('role')
    .notEmpty().withMessage('Role is required')
    .bail()
    .isIn(['customer', 'mechanic']).withMessage('Role must be either customer or mechanic'),
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .bail()
    .isEmail().withMessage('Please enter a valid email address'),

  body('password').notEmpty().withMessage('Password is required'),
];

module.exports = {
  registerValidator,
  loginValidator,
};