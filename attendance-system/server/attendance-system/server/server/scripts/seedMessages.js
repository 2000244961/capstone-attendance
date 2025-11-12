// Script to seed sample inbox messages for admin, teacher, and parent roles
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/attendance';

async function seed() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  // Find sample users (assume at least one admin, teacher, parent exists)
  const admin = await User.findOne({ type: 'admin' });
  const teacher = await User.findOne({ type: 'teacher' });
  const parent = await User.findOne({ type: 'parent' });
  if (!admin || !teacher || !parent) {
    console.error('Sample users not found. Please ensure at least one admin, teacher, and parent exist.');
    process.exit(1);
  }

  // Sample messages
  const messages = [
    // Admin to Teacher
    {
      sender: { id: admin._id, role: 'admin' },
      recipient: { id: teacher._id, role: 'teacher' },
      type: 'message',
      subject: 'Welcome',
      content: 'Welcome to the faculty portal!',
      status: 'unread'
    },
    // Admin to Parent
    {
      sender: { id: admin._id, role: 'admin' },
      recipient: { id: parent._id, role: 'parent' },
      type: 'message',
      subject: 'Parent Orientation',
      content: 'Please attend the parent orientation next week.',
      status: 'unread'
    },
    // Teacher to Parent
    {
      sender: { id: teacher._id, role: 'teacher' },
      recipient: { id: parent._id, role: 'parent' },
      type: 'message',
      subject: 'Student Progress',
      content: 'Your child is doing well in class.',
      status: 'unread'
    },
    // Parent to Teacher (Excuse Letter)
    {
      sender: { id: parent._id, role: 'parent' },
      recipient: { id: teacher._id, role: 'teacher' },
      type: 'excuse_letter',
      subject: 'Excuse Letter',
      content: 'My child was sick on Sept 28. Please excuse the absence.',
      status: 'pending',
      excuseDate: new Date('2025-09-28')
    },
    // Teacher approves Excuse Letter (response)
    // This will be updated via API after seeding
  ];

  await Message.deleteMany({});
  await Message.insertMany(messages);
  console.log('Sample messages seeded.');
  process.exit(0);
}

seed();
