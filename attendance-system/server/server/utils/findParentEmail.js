const User = require('../models/User');
const mongoose = require('mongoose');

// Robust parent email lookup: supports both ObjectId and string studentId in linkedStudent
async function findParentEmailByStudentId(studentId) {
  const studentIdStr = String(studentId);

  // 1️⃣ Try direct ObjectId or string match
  let parent = await User.findOne({
    type: 'parent',
    linkedStudent: mongoose.Types.ObjectId.isValid(studentIdStr)
      ? new mongoose.Types.ObjectId(studentIdStr)
      : studentIdStr
  });
  if (parent?.email) return parent.email;

  // 2️⃣ Try matching via populated student.studentId (if using refs)
  const parents = await User.find({ type: 'parent' }).populate('linkedStudent', 'studentId email');
  for (const p of parents) {
    const linked = Array.isArray(p.linkedStudent) ? p.linkedStudent : [p.linkedStudent];
    for (const student of linked) {
      if (student?.studentId && String(student.studentId) === studentIdStr) {
        return p.email;
      }
    }
  }
  return null;
}

module.exports = { findParentEmailByStudentId };
