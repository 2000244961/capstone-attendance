const path = require('path');
const mongoose = require('mongoose');
const Attendance = require(path.resolve(__dirname, '../../server/models/Attendance'));
require('dotenv').config({ path: path.resolve(__dirname, '../../server/.env') });
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/attendance';

const dateArg = process.argv[2]; // e.g. 2025-11-05
const sectionArg = process.argv[3]; // e.g. 68fbbdaa346a19ce0bd41800

async function main() {
  await mongoose.connect(MONGO_URI);
  let query = {};
  if (dateArg) {
    const start = new Date(dateArg);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    query.date = { $gte: start, $lt: end };
  }
  if (sectionArg) {
    query.section = sectionArg;
  }
  const records = await Attendance.find(query);
  console.log(`Found ${records.length} attendance records for date ${dateArg} and section ${sectionArg}`);
  records.forEach(r => {
    console.log({
      _id: r._id,
      studentId: r.studentId,
      name: r.name,
      section: r.section,
      status: r.status,
      timestamp: r.timestamp,
      date: r.date
    });
  });
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
