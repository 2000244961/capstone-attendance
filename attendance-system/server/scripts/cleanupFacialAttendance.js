// This script removes attendance records that were NOT created via facial recognition.
const mongoose = require('mongoose');
const Attendance = require('../server/models/Attendance');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/attendance';

async function cleanupFacialAttendance() {
  await mongoose.connect(MONGO_URI);
  const result = await Attendance.deleteMany({ $or: [ { viaFacialRecognition: { $ne: true } }, { viaFacialRecognition: { $exists: false } } ] });
  console.log(`Deleted ${result.deletedCount} attendance records not created by facial recognition.`);
  await mongoose.disconnect();
}

cleanupFacialAttendance().catch(err => {
  console.error('Error cleaning up attendance:', err);
  process.exit(1);
});
