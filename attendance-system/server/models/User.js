const mongoose = require('mongoose');

const AssignedSectionSchema = new mongoose.Schema({
  sectionName: String,
  sectionId: mongoose.Schema.Types.ObjectId
});

const UserSchema = new mongoose.Schema({
  studentId: String,
  name: String,
  fullName: String,
  type: String, // 'student', 'teacher', etc.
  section: { type: mongoose.Schema.Types.Mixed }, // can be ObjectId or String
  assignedSections: [AssignedSectionSchema]
});

module.exports = mongoose.model('User', UserSchema);
