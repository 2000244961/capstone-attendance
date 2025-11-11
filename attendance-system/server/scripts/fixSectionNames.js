const path = require('path');
const mongoose = require('mongoose');
const SubjectSection = require(path.resolve(__dirname, '../../server/models/SubjectSection'));
require('dotenv').config({ path: path.resolve(__dirname, '../../server/.env') });
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/attendance';

async function main() {
  await mongoose.connect(MONGO_URI);
  const sections = await SubjectSection.find({});
  let updated = 0;
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const newName = `Section ${i + 1}`;
    section.sectionName = newName;
    await section.save();
    updated++;
    console.log(`Updated section ${section._id} with sectionName: ${newName}`);
  }
  console.log(`Updated ${updated} sections.`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
