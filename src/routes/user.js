const express = require('express');
const router = express.Router();
const { upload, handleUploadError } = require('../middleware/upload');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Profile update
router.patch('/profile', auth, userController.updateProfile);

// Profile photo upload
router.post('/upload-avatar', auth, upload.single('avatar'), handleUploadError, userController.uploadAvatar);

// Get profile
router.get('/profile/:userId', auth, userController.getProfile);

// Add friend
router.post('/friends/:friendId', auth, userController.addFriend);

// Remove friend
router.delete('/friends/:friendId', auth, userController.removeFriend);

// Get friends
router.get('/friends', auth, userController.getFriends);

// Search users
router.get('/search', auth, userController.searchUsers);

module.exports = router; 