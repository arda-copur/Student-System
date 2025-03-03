const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');

// Register
router.post('/register', registerLimiter, authController.register);

// Login
router.post('/login', loginLimiter, authController.login);

// Logout
router.post('/logout', auth, authController.logout);

module.exports = router; 