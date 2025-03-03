const Note = require('../models/Note');

exports.createNote = async (req, res) => {
  try {
    const { title, content, category, youtubeLinks } = req.body;
    
    const note = new Note({
      user: req.user.userId,
      title,
      content,
      category,
      youtubeLinks: youtubeLinks || []
    });

    await note.save();

    res.status(201).json({
      message: 'Note created successfully',
      note
    });
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred while creating note',
      error: error.message
    });
  }
};

exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.userId })
      .sort({ createdAt: -1 });

    res.json({ notes });
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred while retrieving notes',
      error: error.message
    });
  }
};

exports.getNote = async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.noteId,
      user: req.user.userId
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json({ note });
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred while retrieving note',
      error: error.message
    });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const updates = {};
    const allowedUpdates = ['title', 'content', 'category', 'youtubeLinks'];
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const note = await Note.findOneAndUpdate(
      {
        _id: req.params.noteId,
        user: req.user.userId
      },
      updates,
      { new: true, runValidators: true }
    );

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json({
      message: 'Note updated successfully',
      note
    });
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred while updating note',
      error: error.message
    });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.noteId,
      user: req.user.userId
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred while deleting note',
      error: error.message
    });
  }
};

exports.addYoutubeLink = async (req, res) => {
  try {
    const { title, url } = req.body;
    
    const note = await Note.findOne({
      _id: req.params.noteId,
      user: req.user.userId
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    note.youtubeLinks.push({
      title,
      url
    });

    await note.save();

    res.json({
      message: 'YouTube link added successfully',
      note
    });
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred while adding YouTube link',
      error: error.message
    });
  }
};

exports.removeYoutubeLink = async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.noteId,
      user: req.user.userId
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    note.youtubeLinks = note.youtubeLinks.filter(
      link => link._id.toString() !== req.params.linkId
    );

    await note.save();

    res.json({
      message: 'YouTube link removed successfully',
      note
    });
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred while removing YouTube link',
      error: error.message
    });
  }
}; 