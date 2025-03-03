const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  youtubeLinks: [{
    title: String,
    url: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index: for quickly finding user notes by category
noteSchema.index({ user: 1, category: 1, updatedAt: -1 });

// Automatically update the update time
noteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Note = mongoose.model('Note', noteSchema);

module.exports = Note; 