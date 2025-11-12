const path = require('path');
const mongoose = require('mongoose');
const User = require(path.resolve(__dirname, '../../server/models/User'));
const SubjectSection = require(path.resolve(__dirname, '../../server/models/SubjectSection'));
require('dotenv').config({ path: path.resolve(__dirname, '../../server/.env') });
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/attendance';

async function main() {
  await mongoose.connect(MONGO_URI);
  const sections = await SubjectSection.find({});
  if (sections.length === 0) {
    console.log('No sections found. Please seed SubjectSection first.');
    await mongoose.disconnect();
    return;
  }
  // Seed 3 demo students per section
  let created = 0;
  for (const section of sections) {
    for (let i = 1; i <= 3; i++) {
      const student = new User({
        studentId: `${section.sectionName || section._id}-S${i}`,
        name: `Student ${i} of ${section.sectionName || section._id}`,
        username: `student${i}_${section._id}`,
        email: `student${i}_${section._id}@demo.com`,
        type: 'student',
        section: section._id,
        assignedSections: [{ sectionName: section.sectionName || '', sectionId: section._id }]
      });
      await student.save();
      created++;
    }
  }
  console.log(`Seeded ${created} demo students.`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
