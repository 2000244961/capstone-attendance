const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  name: { type: String, required: true },
  section: { type: String },
  subject: { type: String },
  status: { type: String }, // 'present' or 'absent'
  date: { type: Date, required: true }, // Use Date type for correct date matching
  timestamp: { type: Date, default: Date.now }, // Actual scan/mark time
  viaFacialRecognition: { type: Boolean, default: false },
  markedBy: { type: String, default: 'system' }, // 'system', 'teacher', etc.
  reason: { type: String }, // Reason for absence if needed
});

module.exports = mongoose.model('Attendance', AttendanceSchema);