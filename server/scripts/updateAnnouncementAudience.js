// Script to update all old announcements to have a default audience
const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');

async function updateAnnouncements() {
  await mongoose.connect('mongodb://127.0.0.1:27017/attendance');
  const result = await Announcement.updateMany(
    { audience: { $exists: false } },
    { $set: { audience: 'both' } }
  );
  console.log(`Updated ${result.modifiedCount} announcements.`);
  await mongoose.disconnect();
}

updateAnnouncements().catch(console.error);
