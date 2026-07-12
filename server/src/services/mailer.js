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

const sendOtpEmail = async ({ to, otp, subject, devLabel }) => {
  const isProduction = process.env.NODE_ENV === "production";
  // In dev, always log instead of attempting a real send - .env ships with
  // placeholder (non-empty) SMTP_* values, so a truthy check alone would try
  // and hang/fail against real Gmail with fake creds. Opt into a real send
  // during local testing with SMTP_FORCE_SEND=true.
  const shouldSend = isProduction || process.env.SMTP_FORCE_SEND === "true";

  if (!shouldSend) {
    console.log(`${devLabel} for ${to}: ${otp}`);
    return;
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP credentials are not configured");
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text: `Your verification code is ${otp}. It expires soon.`,
    html: `<p>Your verification code is <strong>${otp}</strong>.</p><p>It expires soon.</p>`,
  });
};

const sendSignupOtp = async ({ to, otp }) =>
  sendOtpEmail({ to, otp, subject: "Your signup verification code", devLabel: "Signup OTP" });

const sendPasswordResetOtp = async ({ to, otp }) =>
  sendOtpEmail({ to, otp, subject: "Your password reset code", devLabel: "Password reset OTP" });

module.exports = {
  sendSignupOtp,
  sendPasswordResetOtp,
};
