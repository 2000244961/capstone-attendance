const cron = require('node-cron');
const { exec } = require('child_process');

// Schedule to run every day at 4:01pm
cron.schedule('1 16 * * *', () => {
  console.log('Running autoMarkAbsent.js at 4:01pm...');
  exec('node server/scripts/autoMarkAbsent.js', (err, stdout, stderr) => {
    if (err) {
      console.error('Error running autoMarkAbsent:', err);
      return;
    }
    console.log('autoMarkAbsent output:', stdout);
    if (stderr) {
      console.error('autoMarkAbsent stderr:', stderr);
    }
  });
});

console.log('autoAbsentScheduler is running. It will auto-mark absents every day at 4:01pm.');
