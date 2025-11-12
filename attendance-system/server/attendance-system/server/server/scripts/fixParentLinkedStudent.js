// Script to ensure all parent users have a linkedStudent field (empty array if missing)
const mongoose = require('mongoose');
const User = require('../models/User');

async function fixParentLinkedStudent() {
  await mongoose.connect('mongodb://localhost:27017/attendance', { useNewUrlParser: true, useUnifiedTopology: true });
  const parents = await User.find({ type: 'parent' });
  let updated = 0;
  for (const parent of parents) {
    if (!Array.isArray(parent.linkedStudent)) {
      parent.linkedStudent = [];
      await parent.save();
      updated++;
      console.log(`Updated parent: ${parent.username}`);
    }
  }
  console.log(`Done. Updated ${updated} parent users.`);
  mongoose.disconnect();
}

fixParentLinkedStudent().catch(err => {
  console.error('Error updating parents:', err);
  mongoose.disconnect();
});
