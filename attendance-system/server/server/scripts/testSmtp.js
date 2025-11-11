// Script to test SMTP email sending
require('dotenv').config({ path: '../.env' });
const { sendMail } = require('../utils/mailer');

async function test() {
  try {
    await sendMail({
      to: process.env.SMTP_USER,
      subject: 'SMTP Test',
      text: 'This is a test email from your attendance system SMTP setup.'
    });
    console.log('SMTP test email sent successfully!');
  } catch (err) {
    console.error('SMTP test failed:', err);
  }
}

test();
