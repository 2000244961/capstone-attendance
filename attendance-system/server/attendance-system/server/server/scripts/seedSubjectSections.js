// Script to seed subjectsections collection with a default entry
const mongoose = require('mongoose');
const SubjectSection = require('../models/SubjectSection');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/attendance';

async function main() {
  await mongoose.connect(MONGO_URI);
  const section = '101';
  const subject = 'Math';
  const exists = await SubjectSection.findOne({ section, subject });
  if (!exists) {
    const newItem = new SubjectSection({ section, subject });
    await newItem.save();
    console.log('Seeded subjectsections with:', newItem);
  } else {
    console.log('SubjectSection already exists:', exists);
  }
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error seeding subjectsections:', err);
  process.exit(1);
});
