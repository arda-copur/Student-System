const rateLimit = require('express-rate-limit');

// API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Maximum requests per IP
  message: {
    message: 'Too many requests, please try again after 15 minutes.'
  }
});

// Login rate limiter
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Maximum login attempts per IP
  message: {
    message: 'Too many login attempts, please try again after 1 hour.'
  }
});

// Register rate limiter
const registerLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // Maximum registrations per IP
  message: {
    message: 'Maximum registration limit reached, please try again after 24 hours.'
  }
});

module.exports = {
  apiLimiter,
  loginLimiter,
  registerLimiter
}; 