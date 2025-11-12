const nodemailer = require('nodemailer');



const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, 
  auth: {
    user: 'spcc10102025@gmail.com',
    pass: 'ojnu ddoc xsmv syxs'
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
    from: process.env.SMTP_FROM || process.env.SMTP_USER || 'spcc10102025@gmail.com',
    to,
    subject,
    text,
    html,
    attachments
  });
}

module.exports = { sendMail };
