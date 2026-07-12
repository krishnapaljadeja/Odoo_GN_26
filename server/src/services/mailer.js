const nodemailer = require("nodemailer");

const createTransporter = () => {
  const port = Number(process.env.SMTP_PORT || 587);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendSignupOtp = async ({ to, otp }) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`Signup OTP for ${to}: ${otp}`);
      return;
    }

    throw new Error("SMTP credentials are not configured");
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: "Your signup verification code",
    text: `Your verification code is ${otp}. It expires soon.`,
    html: `<p>Your verification code is <strong>${otp}</strong>.</p><p>It expires soon.</p>`,
  });
};

module.exports = {
  sendSignupOtp,
};
