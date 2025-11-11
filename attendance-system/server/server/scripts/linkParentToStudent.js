// Script to link a parent to a student by username and studentId
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const User = require('../models/User');

async function linkParentToStudent(parentUsername, studentId) {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  // Find parent user
  const parent = await User.findOne({ username: parentUsername, type: 'parent' });
  if (!parent) {
    console.error('Parent not found');
    process.exit(1);
  }
  // Find student by studentId
  const Student = mongoose.model('Student');
  const student = await Student.findOne({ studentId });
  if (!student) {
    console.error('Student not found');
    process.exit(1);
  }
  // Add student ObjectId to parent's linkedStudent array if not already present
  if (!parent.linkedStudent.some(id => id.equals(student._id))) {
    parent.linkedStudent.push(student._id);
    await parent.save();
    console.log(`Linked student ${studentId} to parent ${parentUsername}`);
  } else {
    console.log('Already linked');
  }
  mongoose.disconnect();
}

// Usage: node linkParentToStudent.js parentUsername studentId
if (require.main === module) {
  const [,, parentUsername, studentId] = process.argv;
  if (!parentUsername || !studentId) {
    console.log('Usage: node linkParentToStudent.js parentUsername studentId');
    process.exit(1);
  }
  linkParentToStudent(parentUsername, studentId);
}
