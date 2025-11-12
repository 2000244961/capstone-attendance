const User = require('../models/User');
const mongoose = require('mongoose');

// Find parent user by studentId (string)
async function findParentEmailByStudentId(studentId) {
  // Try to find parent by linkedStudent ObjectId match
  let parent = await User.findOne({ type: 'parent', linkedStudent: studentId });
  if (parent && parent.email) return parent.email;

  // If not found, try to match by studentId string in populated linkedStudent
  const parents = await User.find({ type: 'parent' }).populate('linkedStudent');
  for (const p of parents) {
    if (Array.isArray(p.linkedStudent)) {
      for (const student of p.linkedStudent) {
        if (student.studentId && String(student.studentId) === String(studentId)) {
          return p.email;
        }
      }
    }
  }
  return null;
}

module.exports = { findParentEmailByStudentId };
