const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  message: { type: String, required: true },
  author: { type: String, required: true },
  authorId: { type: String, required: true },
  audience: { type: String, enum: ['teachers', 'parents', 'both'], default: 'teachers' },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
