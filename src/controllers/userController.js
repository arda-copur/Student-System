const User = require('../models/User');
const Message = require('../models/Message');
const path = require('path');
const fs = require('fs');

exports.updateProfile = async (req, res) => {
  try {
    const updates = {};
    const allowedUpdates = ['username', 'email', 'grade', 'avatar'];
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        grade: user.grade,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred while updating profile',
      error: error.message
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password')
      .populate('friends', 'username avatar isOnline lastActive');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate active usage time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayActiveTime = user.dailyActiveTime.find(
      time => new Date(time.date).setHours(0, 0, 0, 0) === today.getTime()
    );

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        grade: user.grade,
        avatar: user.avatar,
        isOnline: user.isOnline,
        lastActive: user.lastActive,
        todayActiveTime: todayActiveTime ? todayActiveTime.duration : 0,
        friends: user.friends,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred while retrieving profile information',
      error: error.message
    });
  }
};

exports.addFriend = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const friend = await User.findById(req.params.friendId);

    if (!friend) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.friends.includes(friend._id)) {
      return res.status(400).json({ message: 'This user is already your friend' });
    }

    user.friends.push(friend._id);
    friend.friends.push(user._id);

    await user.save();
    await friend.save();

    res.json({ message: 'Friend added successfully' });
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred while adding friend',
      error: error.message
    });
  }
};

exports.removeFriend = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const friend = await User.findById(req.params.friendId);

    if (!friend) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.friends = user.friends.filter(id => !id.equals(friend._id));
    friend.friends = friend.friends.filter(id => !id.equals(user._id));

    await user.save();
    await friend.save();

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred while removing friend',
      error: error.message
    });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('friends', 'username avatar isOnline lastActive');

    res.json({ friends: user.friends });
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred while retrieving friend list',
      error: error.message
    });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const searchTerm = req.query.q;
    const users = await User.find({
      $and: [
        {
          $or: [
            { username: new RegExp(searchTerm, 'i') },
            { email: new RegExp(searchTerm, 'i') }
          ]
        },
        { _id: { $ne: req.user.userId } }
      ]
    }).select('username email avatar grade isOnline');

    res.json({ users });
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred while searching users',
      error: error.message
    });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please select a profile photo.' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Delete old avatar if exists
    if (user.avatar) {
      const oldAvatarPath = path.join(__dirname, '../../uploads/', user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Save new avatar
    user.avatar = req.file.filename;
    await user.save();

    res.json({
      message: 'Profile photo updated successfully.',
      avatar: req.file.filename
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'An error occurred while updating profile photo.' });
  }
}; 