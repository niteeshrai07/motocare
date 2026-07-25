const { body } = require('express-validator');

const INDIAN_MOBILE_REGEX = /^(\+91)?[6-9]\d{9}$/;

// Removes spaces and hyphens users commonly include when typing a phone number,
// so formatting variance (e.g. "+91 98765 43210") doesn't cause rejection.
const normalizePhone = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(/[\s-]/g, '');
};

// Strips the +91 prefix so every stored phone number is a canonical 10-digit value.
const toCanonicalPhone = (value) => {
  if (typeof value !== 'string') return value;
  return value.startsWith('+91') ? value.slice(3) : value;
};

const phoneValidator = ({ required = true } = {}) => {
  const validator = body('phone').trim().customSanitizer(normalizePhone);

  if (required) {
    validator.notEmpty().withMessage('Phone number is required').bail();
  } else {
    // Only skip validation when the field is entirely absent from the request.
    // An explicitly sent "" or null is NOT treated as "omitted" — it proceeds
    // to notEmpty() below and is correctly rejected.
    validator.optional({ values: 'undefined' }).notEmpty().withMessage('Phone number cannot be empty').bail();
  }

  return validator
    .matches(INDIAN_MOBILE_REGEX)
    .withMessage('Phone number must be a valid 10-digit Indian mobile number, optionally prefixed with +91')
    .bail()
    .customSanitizer(toCanonicalPhone);
};

module.exports = {
  phoneValidator,
};