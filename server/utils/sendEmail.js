const nodemailer = require('nodemailer');

const sendEmail = async (email, subject = "Your OTP Code", text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS, // Your Gmail App Password
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      text: text,
    });

    console.log("📧 Email sent successfully to " + email);
  } catch (error) {
    console.log("❌ Email not sent:", error);
    throw error; // ensures frontend knows about failures
  }
};

module.exports = sendEmail;
