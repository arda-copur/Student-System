const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

// Send message
router.post('/', auth, messageController.sendMessage);

// Get conservation with user
router.get('/conversation/:userId', auth, messageController.getConversation);

// Get all conservations
router.get('/conversations', auth, messageController.getConversations);

// Mark as read
router.post('/read/:conversationId', auth, messageController.markAsRead);

module.exports = router; 