const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});



//const transporter = nodemailer.createTransport({
// host: 'smtp.gmail.com',
//  port: 465,
//  secure: true, 
//  auth: {
//    user: 'spcc10102025@gmail.com',
 //   pass: 'bffd drzf mjrt spez'
//  }
//});



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
