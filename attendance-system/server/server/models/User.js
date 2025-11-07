const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  fullName: { type: String },
  contact: { type: String },
  type: { type: String, enum: ['teacher', 'parent', 'admin'], required: true },
  approved: { type: Boolean, default: true }, // admin approval required
  createdAt: { type: Date, default: Date.now },
  // Teacher assignments
  assignedSections: [{
    sectionName: String,
    subjectName: String
  }],
  subjects: [{
    type: String // subject name or id
  }],
  // Parent linked students
  linkedStudent: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }]
});

module.exports = mongoose.model('User', UserSchema);
