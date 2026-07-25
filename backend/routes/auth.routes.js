const express = require('express');
const router = express.Router();

const { register, login, getCurrentUser } = require('../controllers/auth.controller');
const { registerValidator, loginValidator } = require('../validators/auth.validator');
const handleValidationErrors = require('../middleware/validation.middleware');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/register', registerValidator, handleValidationErrors, register);
router.post('/login', loginValidator, handleValidationErrors, login);
router.get('/me', verifyToken, getCurrentUser);


module.exports = router;