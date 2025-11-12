// Script to fix parent linkedStudent array to use string studentId values
// Usage: node fixParentLinkedStudentIds.js

const mongoose = require('mongoose');
const User = require('./server/models/User');

// Replace with your MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/your-db-name';

async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  // Find all parents
  const parents = await User.find({ type: 'parent' });
  for (const parent of parents) {
    if (Array.isArray(parent.linkedStudent) && parent.linkedStudent.length > 0) {
      // Convert all ObjectIds to string if needed
      const newLinked = parent.linkedStudent.map(id => (typeof id === 'object' && id.toString ? id.toString() : String(id)));
      parent.linkedStudent = newLinked;
      await parent.save();
      console.log(`Updated parent ${parent._id}: linkedStudent =`, newLinked);
    }
  }
  console.log('All parent linkedStudent arrays updated to string IDs.');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error updating parent linkedStudent arrays:', err);
  process.exit(1);
});
