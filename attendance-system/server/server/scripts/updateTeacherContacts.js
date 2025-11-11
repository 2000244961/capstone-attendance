// Script to update all teachers with a sample contact number
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = 'mongodb://localhost:27017/attendance-system'; // Change if needed

async function updateTeacherContacts() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const teachers = await User.find({ type: 'teacher' });
  for (const teacher of teachers) {
    teacher.contact = teacher.contact || '09171234567'; // Set a sample contact if missing
    await teacher.save();
    console.log(`Updated teacher: ${teacher.username}, contact: ${teacher.contact}`);
  }
  await mongoose.disconnect();
  console.log('All teachers updated.');
}

updateTeacherContacts().catch(err => {
  console.error('Error updating teachers:', err);
  process.exit(1);
});
