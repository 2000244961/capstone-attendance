const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  name: { type: String, required: true },
  section: { type: String },
  subject: { type: String },
  status: { type: String },
  date: { type: String },
  timestamp: { type: Date, default: Date.now },
  viaFacialRecognition: { type: Boolean, default: false },
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
