// Script to check and fix parent linkedStudent references for email notifications
// Usage: node fixParentLinkedStudentRefs.js

const mongoose = require('mongoose');
const User = require('./server/models/User');


const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/attendance';

async function main() {
  await mongoose.connect(MONGO_URI);
  const parents = await User.find({ type: 'parent' });
  let fixed = 0;
  for (const parent of parents) {
    if (!Array.isArray(parent.linkedStudent) || parent.linkedStudent.length === 0) continue;
    let needsUpdate = false;
    const newLinked = [];
    for (const ref of parent.linkedStudent) {
      // If already ObjectId, keep as is
      if (mongoose.Types.ObjectId.isValid(ref)) {
        newLinked.push(ref);
        continue;
      }
      // If ref is a string studentId, find the User with type 'student'
      const student = await User.findOne({ studentId: ref, type: 'student' });
      if (student) {
        newLinked.push(student._id);
        needsUpdate = true;
      }
    }
    if (needsUpdate) {
      parent.linkedStudent = newLinked;
      await parent.save();
      fixed++;
      console.log(`Fixed parent ${parent._id}: linkedStudent updated.`);
    }
  }
  console.log(`Done. Fixed ${fixed} parent records.`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
