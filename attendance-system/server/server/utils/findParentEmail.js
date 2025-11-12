const User = require('../models/User');
const mongoose = require('mongoose');

// Find parent user by studentId (string)
async function findParentEmailByStudentId(studentId) {
  // Find parent whose linkedStudent array contains the studentId string
  const parent = await User.findOne({ type: 'parent', linkedStudent: studentId });
  return parent ? parent.email : null;
}

module.exports = { findParentEmailByStudentId };
