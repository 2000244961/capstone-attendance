const path = require('path');
const mongoose = require('mongoose');
const User = require(path.resolve(__dirname, '../../server/models/User'));
require('dotenv').config({ path: path.resolve(__dirname, '../../server/.env') });
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/attendance';

async function main() {
  await mongoose.connect(MONGO_URI);
  const students = await User.find({ type: 'student' });
  console.log(`Found ${students.length} students.`);
  students.forEach(student => {
    console.log({
      _id: student._id,
      studentId: student.studentId,
      name: student.name || student.fullName,
      section: student.section,
      assignedSections: student.assignedSections
    });
  });
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
