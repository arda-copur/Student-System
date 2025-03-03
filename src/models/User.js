const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'],
    index: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: 'Please enter a valid email address'
    },
    index: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  grade: {
    type: Number,
    required: [true, 'Grade level is required'],
    min: [1, 'Grade level cannot be less than 1'],
    max: [12, 'Grade level cannot exceed 12']
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastActive: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  tokenVersion: {
    type: Number,
    default: 0
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLocked: {
    type: Boolean,
    default: false
  },
  lockUntil: {
    type: Date
  },
  dailyActiveTime: [{
    date: {
      type: Date,
      default: Date.now
    },
    duration: {
      type: Number,
      default: 0
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Password verification
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    
    // Manage failed login attempts
    if (!isMatch) {
      this.failedLoginAttempts += 1;
      
      // Lock account after 5 failed attempts
      if (this.failedLoginAttempts >= 5) {
        this.accountLocked = true;
        this.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }
      
      await this.save();
    } else {
      // Reset counter on successful login
      if (this.failedLoginAttempts > 0) {
        this.failedLoginAttempts = 0;
        this.accountLocked = false;
        this.lockUntil = null;
        await this.save();
      }
    }
    
    return isMatch;
  } catch (error) {
    throw new Error('Password verification error');
  }
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  if (!this.accountLocked) return false;
  
  if (this.lockUntil && this.lockUntil < new Date()) {
    this.accountLocked = false;
    this.failedLoginAttempts = 0;
    this.lockUntil = null;
    this.save();
    return false;
  }
  
  return true;
};

const User = mongoose.model('User', userSchema);

module.exports = User; 