const User = require('../models/User');
const jwt = require('jsonwebtoken');
const validator = require('validator');

// Password security check
const isPasswordSecure = (password) => {
  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return password.length >= minLength && 
         hasUpperCase && 
         hasLowerCase && 
         hasNumbers && 
         hasSpecialChar;
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, grade } = req.body;

    // Input validation
    if (!username || !email || !password || !grade) {
      return res.status(400).json({
        message: 'All fields are required'
      });
    }

    // Email validation
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        message: 'Please enter a valid email address'
      });
    }

    // Password security check
    if (!isPasswordSecure(password)) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long and contain uppercase, lowercase, number and special character'
      });
    }

    // Check username and email
    const existingUser = await User.findOne({
      $or: [
        { username: { $regex: new RegExp('^' + username + '$', 'i') } },
        { email: { $regex: new RegExp('^' + email + '$', 'i') } }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'This username or email is already in use'
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      grade
    });

    await user.save();

    // Create token
    const token = jwt.sign(
      { 
        userId: user._id,
        version: user.tokenVersion
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        grade: user.grade,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'An error occurred during registration'
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      const remainingTime = Math.ceil((user.lockUntil - new Date()) / 1000 / 60);
      return res.status(401).json({
        message: `Account is locked. Try again in ${remainingTime} minutes`
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const remainingAttempts = 5 - user.failedLoginAttempts;
      return res.status(401).json({
        message: `Invalid email or password. ${remainingAttempts} attempts remaining`
      });
    }

    // Mark user as online
    user.isOnline = true;
    user.lastActive = new Date();
    user.tokenVersion += 1;
    await user.save();

    // Create token
    const token = jwt.sign(
      { 
        userId: user._id,
        version: user.tokenVersion
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        grade: user.grade,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'An error occurred during login'
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user) {
      user.isOnline = false;
      user.lastActive = new Date();
      user.tokenVersion += 1; // Invalidate token
      await user.save();
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      message: 'An error occurred during logout'
    });
  }
}; 