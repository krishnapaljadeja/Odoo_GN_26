const bcrypt = require("bcryptjs");

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const hashOtp = async (otp) => bcrypt.hash(otp, 10);

const verifyOtp = async (otp, otpHash) => bcrypt.compare(otp, otpHash);

const getOtpExpiry = () => {
  const minutes = Number(process.env.OTP_EXPIRES_IN_MINUTES || 10);
  return new Date(Date.now() + minutes * 60 * 1000);
};

module.exports = {
  generateOtp,
  getOtpExpiry,
  hashOtp,
  verifyOtp,
};
