const User = require('../models/User');
const mongoose = require('mongoose');

// Find parent user by studentId (string)
async function findParentEmailByStudentId(studentId) {
  // Find parent whose linkedStudent contains a student with this studentId
  // We need to populate linkedStudent to get studentId field
  const parents = await User.find({ type: 'parent' }).populate('linkedStudent');
  for (const parent of parents) {
    if (Array.isArray(parent.linkedStudent)) {
      for (const student of parent.linkedStudent) {
        if (student.studentId === studentId) {
          return parent.email;
        }
      }
    }
  }
  return null;
}

module.exports = { findParentEmailByStudentId };
