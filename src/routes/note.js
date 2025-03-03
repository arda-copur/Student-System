const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const auth = require('../middleware/auth');

// Create note
router.post('/', auth, noteController.createNote);

// Get notes
router.get('/', auth, noteController.getNotes);

// Get note
router.get('/:noteId', auth, noteController.getNote);

// Update note
router.patch('/:noteId', auth, noteController.updateNote);

// Delete note
router.delete('/:noteId', auth, noteController.deleteNote);

// Add youtube link
router.post('/:noteId/youtube', auth, noteController.addYoutubeLink);

// Remove youtube link
router.delete('/:noteId/youtube/:linkId', auth, noteController.removeYoutubeLink);

module.exports = router; 