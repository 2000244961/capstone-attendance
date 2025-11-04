const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  audience: { type: String, enum: ['teachers', 'parents', 'both', 'all'], default: 'teachers' },
  postedBy: { type: String, required: true },
  fileUrl: { type: String }, // optional, only if you use file attachments
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Announcement', announcementSchema);