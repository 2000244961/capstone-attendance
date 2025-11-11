// This script seeds demo users and prints their ObjectIds for use in the frontend.
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = 'mongodb://127.0.0.1:27017/attendance'; // Change if needed

async function seedUsers() {
  await mongoose.connect(MONGO_URI);

  // Remove existing demo users
  await User.deleteMany({ username: { $in: ['parent1', 'teacher1'] } });

  // Create demo users
  const parent = new User({
    username: 'parent1',
    password: 'password',
    email: 'parent1@example.com',
    fullName: 'Parent One',
    type: 'parent',
    approved: true
  });
  const teacher = new User({
    username: 'teacher1',
    password: 'password',
    email: 'teacher1@example.com',
    fullName: 'Teacher One',
    type: 'teacher',
    approved: true
  });

  await parent.save();
  await teacher.save();

  console.log('Parent ID:', parent._id.toString());
  console.log('Teacher ID:', teacher._id.toString());

  await mongoose.disconnect();
}

seedUsers().catch(err => {
  console.error(err);
  process.exit(1);
});
