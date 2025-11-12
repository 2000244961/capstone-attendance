const path = require('path');
const mongoose = require('mongoose');
const SubjectSection = require(path.resolve(__dirname, '../../server/models/SubjectSection'));
require('dotenv').config({ path: path.resolve(__dirname, '../../server/.env') });
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/attendance';

async function main() {
  await mongoose.connect(MONGO_URI);
  const sections = await SubjectSection.find({});
  console.log(`Found ${sections.length} subject sections.`);
  sections.forEach(section => {
    console.log({
      _id: section._id,
      sectionName: section.sectionName,
      subject: section.subject,
      subjectName: section.subjectName
    });
  });
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
