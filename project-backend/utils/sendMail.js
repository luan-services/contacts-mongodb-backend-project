import nodemailer from 'nodemailer';

export const sendEmail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.NODEMAILER_EMAIL_USER,
      pass: process.env.NODEMAILER_EMAIL_PASS,
    }
  });

  await transporter.sendMail({
    from: process.env.NODEMAILER_EMAIL_USER,
    to,
    subject,
    html
  });
};