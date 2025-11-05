const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../server/.env') });
const mongoose = require('mongoose');
const Attendance = require(path.resolve(__dirname, '../../server/models/Attendance'));
const User = require(path.resolve(__dirname, '../../server/models/User'));
const SubjectSection = require(path.resolve(__dirname, '../../server/models/SubjectSection'));
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/attendance';

async function main() {
  console.log('Auto-mark absent script started.');
  let totalStudents = 0;
  let totalAbsentsMarked = 0;
  await mongoose.connect(MONGO_URI);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  console.log('Today (server time):', today.toISOString());

  // Scan window: 6:00 AM to 4:00 PM
  const startTime = new Date(today);
  startTime.setHours(6, 0, 0, 0); // 6:00 AM
  const endTime = new Date(today);
  endTime.setHours(16, 0, 0, 0); // 4:00 PM

  // Get all sections
  const sections = await SubjectSection.find({});
  console.log(`Found ${sections.length} sections`);
  for (const section of sections) {
    // Only process sections and subjects that exist in the admin (not demo/test)
    if (!section.sectionName || !section.subject) continue;
    // You may want to add more admin-specific checks here if needed
    const sectionValue = section.sectionName;
    const subjectValue = section.subject;
    console.log(`Processing admin section: ${sectionValue}, subject: ${subjectValue}`);

    // Only find students with matching sectionName and valid type
    let students = await User.find({
      type: 'student',
      section: sectionValue,
      // Optionally, filter by subject if your User model supports it
    });
    console.log(`Found ${students.length} admin-registered students in section ${sectionValue}`);
    totalStudents += students.length;

    for (const student of students) {
      // Debug: print student and section info
      console.log('Checking student:', {
        studentId: student.studentId || student._id.toString(),
        name: student.name || student.fullName || '',
        section: sectionValue,
        sectionName: section.sectionName || section.name || ''
      });

      // Check if student has any present record for today WITHIN scan window
      const presentRecord = await Attendance.findOne({
        studentId: student.studentId || student._id.toString(),
        section: sectionValue,
        date: today,
        status: 'present',
        timestamp: { $gte: startTime, $lte: endTime }
      });

      if (!presentRecord) {
        // No present record in scan window, check if already marked absent
        const absentRecord = await Attendance.findOne({
          studentId: student.studentId || student._id.toString(),
          section: sectionValue,
          date: today,
          status: 'absent'
        });
        if (absentRecord) {
          console.log('Already marked absent for student:', student.studentId || student._id.toString());
        } else {
          // Mark as absent
          // Set absent date to midnight UTC for the intended day
          const absentDate = new Date(today);
          absentDate.setUTCHours(0, 0, 0, 0);
          const absentData = {
            studentId: student.studentId || student._id.toString(),
            name: student.name && student.name.length > 0 ? student.name : (student.fullName && student.fullName.length > 0 ? student.fullName : `Student ${student.studentId || student._id.toString()}`),
            section: sectionValue,
            subject: section.subject || section.subjectName || '',
            date: absentDate,
            status: 'absent',
            markedBy: 'system',
            timestamp: new Date(),
            viaFacialRecognition: false,
            reason: 'Auto-marked absent at 4:01 PM (no scan between 6am-4pm)'
          };
          console.log('Attempting to mark absent with data:', JSON.stringify(absentData, null, 2));
          const absent = await Attendance.create(absentData);
          console.log('Absent record created:', absent);
          totalAbsentsMarked++;
        }
      } else {
        console.log('Present record found in scan window:', presentRecord._id);
      }
    }
    console.log('Total students processed:', totalStudents);
    console.log('Total absents marked:', totalAbsentsMarked);
  }
  await mongoose.disconnect();
  console.log('Auto-mark absent script completed.');
}

main().catch(err => {
  console.error('Error running auto-mark absent script:', err);
  process.exit(1);
});