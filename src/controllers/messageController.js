const Message = require('../models/Message');
const User = require('../models/User');

exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, content } = req.body;

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const message = new Message({
      sender: req.user.userId,
      recipient: recipientId,
      content
    });

    await message.save();

    res.status(201).json({
      message: 'Message sent successfully',
      messageData: message
    });
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred while sending message',
      error: error.message
    });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const messages = await Message.find({
      $or: [
        { sender: req.user.userId, recipient: userId },
        { sender: userId, recipient: req.user.userId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'username profilePhoto')
    .populate('recipient', 'username profilePhoto');

    res.json({ messages });
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred while retrieving messages',
      error: error.message
    });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.userId },
        { recipient: req.user.userId }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('sender', 'username profilePhoto')
    .populate('recipient', 'username profilePhoto');

    // Group unique conversations
    const conversations = messages.reduce((acc, msg) => {
      const otherUser = msg.sender._id.toString() === req.user.userId
        ? msg.recipient
        : msg.sender;
      
      const conversationId = otherUser._id.toString();
      
      if (!acc[conversationId]) {
        acc[conversationId] = {
          user: otherUser,
          lastMessage: msg,
          unreadCount: msg.recipient._id.toString() === req.user.userId && !msg.read ? 1 : 0
        };
      } else if (!msg.read && msg.recipient._id.toString() === req.user.userId) {
        acc[conversationId].unreadCount++;
      }
      
      return acc;
    }, {});

    res.json({
      conversations: Object.values(conversations)
    });
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred while retrieving conversations',
      error: error.message
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    await Message.updateMany(
      {
        sender: conversationId,
        recipient: req.user.userId,
        read: false
      },
      {
        read: true
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred while marking messages as read',
      error: error.message
    });
  }
}; 