const express = require('express');
const router = express.Router();

const { register, login } = require('../controllers/auth.controller');
const { registerValidator, loginValidator } = require('../validators/auth.validator');
const handleValidationErrors = require('../middleware/validation.middleware');

router.post('/register', registerValidator, handleValidationErrors, register);
router.post('/login', loginValidator, handleValidationErrors, login);

module.exports = router;