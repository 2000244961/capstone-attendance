const mongoose = require('mongoose');

const SubjectSectionSchema = new mongoose.Schema({
  sectionName: String,
  subject: String,
  subjectName: String
});

module.exports = mongoose.model('SubjectSection', SubjectSectionSchema);
