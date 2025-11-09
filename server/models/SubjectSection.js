// SubjectSection.js
const mongoose = require('mongoose');

const SubjectSectionSchema = new mongoose.Schema({
  section: { type: String, required: true },
  subject: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('SubjectSection', SubjectSectionSchema);
