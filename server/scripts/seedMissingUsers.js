// Script to seed placeholder users for missing ObjectIds
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = 'mongodb://127.0.0.1:27017/attendance'; // Change if needed

// List of missing user IDs to seed
const missingUserIds = [
  '68e52819f914857559447848',
  '68dfd7c45457c35ef32cd14e',
  '68db810802d5bdc4c966942e',
  '68dfdbab5457c35ef32cd1a3',
];

async function seedMissingUsers() {
  await mongoose.connect(MONGO_URI);

  for (const id of missingUserIds) {
    // Check if user exists
    const exists = await User.findById(id);
    if (!exists) {
      // Create a placeholder user
      const user = new User({
        _id: id,
        username: `placeholder_${id.slice(-4)}`,
        password: 'password',
        email: `placeholder_${id.slice(-4)}@example.com`,
        fullName: `Placeholder User ${id.slice(-4)}`,
        type: 'parent',
        approved: true
      });
      await user.save();
      console.log('Seeded placeholder user for ID:', id);
    } else {
      console.log('User already exists for ID:', id);
    }
  }

  await mongoose.disconnect();
  console.log('Done seeding missing users.');
}

seedMissingUsers().catch(err => {
  console.error(err);
  process.exit(1);
});
