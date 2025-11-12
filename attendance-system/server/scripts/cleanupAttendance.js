// This script removes attendance records for students not present in the Student collection.
const mongoose = require('mongoose');
const Attendance = require('../server/models/Attendance');
const Student = require('../server/models/Student');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/attendance';

async function cleanupAttendance() {
  await mongoose.connect(MONGO_URI);
  const students = await Student.find({}, 'studentId');
  const validIds = students.map(s => s.studentId);
  const result = await Attendance.deleteMany({ studentId: { $nin: validIds } });
  console.log(`Deleted ${result.deletedCount} attendance records for non-existent students.`);
  await mongoose.disconnect();
}

cleanupAttendance().catch(err => {
  console.error('Error cleaning up attendance:', err);
  process.exit(1);
});
