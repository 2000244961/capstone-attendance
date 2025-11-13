const User = require('../models/User');
const mongoose = require('mongoose');

async function findParentEmailByStudentId(studentId) {
  // Normalize studentId
  const User = mongoose.model('User');
  const student = await Student.findOne({ studentId: studentId.toString() });
  const studentObjId = String(studentId);
  console.log("studentObjId", studentObjId);

  // 1️⃣ Try direct ObjectId match (if linkedStudent stores ObjectId)
  let parent = null;
    parent = await User.findOne({
    type: 'parent',
    // linkedStudent: studentObjId
    linkedStudent: mongoose.Types.ObjectId.isValid(studentObjId)
      ? { $in: [new mongoose.Types.ObjectId(studentObjId)] }
      : studentIdStr
  });

  
  console.log("beforeRetry", parent);
  if (!parent) {
    parent = await User.findOne({
      type: 'parent',
      linkedStudent: { $in: [studentObjId.toString()] }
    });
  }

  console.log("afterRetry", parent);
  
  return parent ? parent?.email : null;
  

  // if (parent?.email) return parent.email;

  // // 2️⃣ Try matching via populated student.studentId
  // const parents = await User.find({ type: 'parent' }).populate('linkedStudent', 'studentId email');

  // for (const p of parents) {
  //   const linked = Array.isArray(p.linkedStudent)
  //     ? p.linkedStudent
  //     : [p.linkedStudent];

  //   for (const student of linked) {
  //     if (student?.studentId && String(student.studentId) === studentIdStr) {
  //       return p.email;
  //     }
  //   }
  // }

  // return null;
}

module.exports = { findParentEmailByStudentId };
