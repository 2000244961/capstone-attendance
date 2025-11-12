const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  name: { type: String, required: true },
  section: { type: mongoose.Schema.Types.Mixed, required: true },
  subject: { type: String },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent', 'late'], required: true },
  markedBy: { type: String },
  timestamp: { type: Date, default: Date.now },
  viaFacialRecognition: { type: Boolean, default: false },
  reason: { type: String }
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
