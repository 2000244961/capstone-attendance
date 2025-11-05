const path = require('path');
const mongoose = require('mongoose');
const SubjectSection = require(path.resolve(__dirname, '../../server/models/SubjectSection'));
require('dotenv').config({ path: path.resolve(__dirname, '../../server/.env') });
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/attendance';

// List of valid section names managed by the admin (update as needed)
const validSectionNames = [
  'YourAdminSection1', // Replace with actual section names from admin
  'YourAdminSection2'
];

async function main() {
  await mongoose.connect(MONGO_URI);
  const allSections = await SubjectSection.find({});
  let deleted = 0;
  for (const section of allSections) {
    if (!validSectionNames.includes(section.sectionName)) {
      await SubjectSection.deleteOne({ _id: section._id });
      console.log(`Deleted section: ${section.sectionName || section._id}`);
      deleted++;
    }
  }
  console.log(`Deleted ${deleted} non-admin sections.`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
