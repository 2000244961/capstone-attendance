const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: true, // ❌ was true, should be false for STARTTLS
  auth: {
    user: 'ext.princejio.tigley@gmail.com',
    pass: 'icvg wcjs ksgr fkjl'
  }
});


// Debug SMTP connection on startup
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to take messages');
  }
});


async function sendMail({ to, subject, text, html, attachments }) {
  return transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
    attachments
  });
}

module.exports = { sendMail };
