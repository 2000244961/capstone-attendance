// Automatically mark students as absent at 4:00 PM if not present
// Place this file in server/scripts/autoMarkAbsent.js

const mongoose = require('mongoose');
const Attendance = require('../../../server/models/Attendance');
const User = require('../../../server/models/User');
const SubjectSection = require('../../../server/models/SubjectSection');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/attendance';

async function main() {
  await mongoose.connect(MONGO_URI);
  const today = new Date();
  today.setHours(0,0,0,0);

  // Get all sections
  const sections = await SubjectSection.find({});
  for (const section of sections) {
    // Get all students in this section
    const students = await User.find({ role: 'student', section: section._id });
    for (const student of students) {
      // Check if student has a present record for today
      const presentRecord = await Attendance.findOne({
        student: student._id,
        section: section._id,
        date: today,
        status: 'present'
      });
      if (!presentRecord) {
        // Check if already marked absent
        const absentRecord = await Attendance.findOne({
          student: student._id,
          section: section._id,
          date: today,
          status: 'absent'
        });
        if (!absentRecord) {
          // Mark as absent
          await Attendance.create({
            student: student._id,
            section: section._id,
            date: today,
            status: 'absent',
            markedBy: 'system',
            markedAt: new Date(),
            reason: 'Auto-marked absent at 4:00 PM'
          });
          console.log(`Marked absent: ${student.fullName || student.username || student._id} in section ${section.sectionName || section.name}`);
        }
      }
    }
  }
  await mongoose.disconnect();
  console.log('Auto-mark absent script completed.');
}

main().catch(err => {
  console.error('Error running auto-mark absent script:', err);
  process.exit(1);
});
