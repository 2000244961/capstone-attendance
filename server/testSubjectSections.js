const mongoose = require('mongoose');
const SubjectSection = require('./models/SubjectSection');

mongoose.connect('mongodb://localhost:27017/attendance');
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  SubjectSection.find().then(items => {
    console.log('SubjectSections:', items);
    process.exit(0);
  }).catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
});
