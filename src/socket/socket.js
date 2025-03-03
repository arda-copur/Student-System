const User = require('../models/User');
const Message = require('../models/Message');

// Map to store online users
const onlineUsers = new Map();

// Update active time function
async function updateActiveTime(userId, userData) {
  try {
    const user = await User.findById(userId);
    if (user) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const activeTimeIndex = user.dailyActiveTime.findIndex(
        time => new Date(time.date).setHours(0, 0, 0, 0) === today.getTime()
      );

      const timeSpent = Math.floor((new Date() - userData.lastUpdate) / 1000);
      userData.lastUpdate = new Date();

      if (activeTimeIndex === -1) {
        user.dailyActiveTime.push({
          date: today,
          duration: timeSpent
        });
      } else {
        user.dailyActiveTime[activeTimeIndex].duration += timeSpent;
      }

      await user.save();
    }
  } catch (error) {
    console.error('Error updating active time:', error);
  }
}

function initializeSocket(io) {
  // Update active times every 5 minutes
  const activeTimeInterval = setInterval(async () => {
    try {
      for (const [userId, userData] of onlineUsers.entries()) {
        await updateActiveTime(userId, userData);
      }
    } catch (error) {
      console.error('Error in active time update cycle:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes

  io.on('connection', async (socket) => {
    console.log('A user connected');

    // Connection error
    socket.on('error', (error) => {
      console.error('Socket connection error:', error);
      socket.emit('connectionError', { message: 'Connection error occurred' });
    });

    // When user connects
    socket.on('userConnected', async (userId) => {
      try {
        if (!userId) {
          throw new Error('Invalid user ID');
        }

        const user = await User.findById(userId);
        if (!user) {
          throw new Error('User not found');
        }

        // If user is already connected, close old connection
        const existingSocket = onlineUsers.get(userId)?.socketId;
        if (existingSocket && existingSocket !== socket.id) {
          io.to(existingSocket).emit('forceDisconnect', { 
            message: 'Logged in from another device' 
          });
        }

        user.isOnline = true;
        user.lastActive = new Date();
        await user.save();

        onlineUsers.set(userId, {
          socketId: socket.id,
          lastUpdate: new Date(),
          connectTime: new Date(),
          reconnectAttempts: 0
        });

        socket.userId = userId; // Add userId to socket object

        io.emit('userStatusUpdate', {
          userId,
          status: 'online',
          lastActive: user.lastActive
        });

        socket.emit('connectionSuccess', { 
          message: 'Connection successful' 
        });

      } catch (error) {
        console.error('Error during user connection:', error);
        socket.emit('connectionError', { 
          message: error.message || 'Error occurred during connection' 
        });
      }
    });

    // When user disconnects
    socket.on('disconnect', async (reason) => {
      try {
        const userId = socket.userId;
        if (!userId) return;

        const userData = onlineUsers.get(userId);
        if (!userData) return;

        // On connection loss
        if (reason === 'transport close' || reason === 'ping timeout') {
          // Wait 30 seconds and if still not connected, mark as offline
          setTimeout(async () => {
            if (!io.sockets.sockets.get(userData.socketId)) {
              const user = await User.findById(userId);
              if (user) {
                user.isOnline = false;
                user.lastActive = new Date();
                await updateActiveTime(userId, userData);
                await user.save();

                onlineUsers.delete(userId);

                io.emit('userStatusUpdate', {
                  userId,
                  status: 'offline',
                  lastActive: user.lastActive
                });
              }
            }
          }, 30000);
        } else {
          // Normal disconnect
          const user = await User.findById(userId);
          if (user) {
            user.isOnline = false;
            user.lastActive = new Date();
            await updateActiveTime(userId, userData);
            await user.save();

            onlineUsers.delete(userId);

            io.emit('userStatusUpdate', {
              userId,
              status: 'offline',
              lastActive: user.lastActive
            });
          }
        }
      } catch (error) {
        console.error('Error during user disconnect:', error);
      }
    });

    // Messaging
    socket.on('sendMessage', async (data) => {
      try {
        if (!data.userId || !data.recipientId || !data.content) {
          throw new Error('Missing message information');
        }

        const message = new Message({
          sender: data.userId,
          recipient: data.recipientId,
          content: data.content
        });
        await message.save();

        const recipientSocket = onlineUsers.get(data.recipientId)?.socketId;
        if (recipientSocket) {
          io.to(recipientSocket).emit('newMessage', {
            messageId: message._id,
            sender: data.userId,
            content: data.content,
            timestamp: message.createdAt
          });
        }

        socket.emit('messageSent', {
          messageId: message._id,
          recipientId: data.recipientId,
          timestamp: message.createdAt
        });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('messageError', { 
          error: error.message || 'Failed to send message' 
        });
      }
    });

    // Typing status
    socket.on('typing', (data) => {
      try {
        if (!data.userId || !data.recipientId) {
          throw new Error('Missing user information');
        }

        const recipientSocket = onlineUsers.get(data.recipientId)?.socketId;
        if (recipientSocket) {
          io.to(recipientSocket).emit('userTyping', {
            userId: data.userId,
            isTyping: data.isTyping
          });
        }
      } catch (error) {
        console.error('Error updating typing status:', error);
      }
    });
  });

  // Clear interval
  io.on('close', () => {
    clearInterval(activeTimeInterval);
  });
}

// Helper functions
function isUserOnline(userId) {
  return onlineUsers.has(userId);
}

function getUserSocketId(userId) {
  return onlineUsers.get(userId)?.socketId;
}

function getOnlineUsers() {
  return Array.from(onlineUsers.keys());
}

module.exports = {
  initializeSocket,
  isUserOnline,
  getUserSocketId,
  getOnlineUsers
}; 