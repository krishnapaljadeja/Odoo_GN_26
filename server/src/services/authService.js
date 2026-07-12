const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("../db");
const { sendPasswordResetOtp, sendSignupOtp } = require("./mailer");
const { generateOtp, getOtpExpiry, hashOtp, verifyOtp } = require("./otp");

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const getAuthSecret = () => {
  if (!process.env.AUTH_TOKEN_SECRET) {
    throw new Error("AUTH_TOKEN_SECRET is not configured");
  }
  return process.env.AUTH_TOKEN_SECRET;
};

const toSafeUser = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  name: user.name,
  role: user.role,
  status: user.status,
  departmentId: user.departmentId,
});

const setAuthCookie = (res, user) => {
  const expiryTime = new Date((+process.env.AUTH_EXPIRES_IN_SECONDS || 604800) * 1000 + Date.now());
  const token = jwt.sign({ userId: user.id }, getAuthSecret());

  res.cookie("t", token, {
    expires: expiryTime,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return expiryTime;
};

const signup = async ({ email, username, name, password }) => {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existing) {
    const field = existing.email === email ? "email" : "username";
    throw new ApiError(409, "ALREADY_REGISTERED", `That ${field} is already registered`);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOtp();
  const otpHash = await hashOtp(otp);

  await prisma.signupOtp.upsert({
    where: { email },
    update: { username, password: hashedPassword, name, otpHash, expiresAt: getOtpExpiry(), attempts: 0 },
    create: { email, username, password: hashedPassword, name, otpHash, expiresAt: getOtpExpiry() },
  });

  await sendSignupOtp({ to: email, otp });

  return { email, expiresAt: getOtpExpiry() };
};

const verifySignup = async (res, { email, otp }) => {
  const pending = await prisma.signupOtp.findUnique({ where: { email } });

  if (!pending) {
    throw new ApiError(404, "NOT_FOUND", "No signup verification was requested for that email");
  }

  if (pending.expiresAt <= new Date()) {
    await prisma.signupOtp.delete({ where: { email } });
    throw new ApiError(410, "OTP_EXPIRED", "Verification code expired, request a new one");
  }

  if (pending.attempts >= 5) {
    await prisma.signupOtp.delete({ where: { email } });
    throw new ApiError(429, "TOO_MANY_ATTEMPTS", "Too many verification attempts, request a new code");
  }

  const otpMatches = await verifyOtp(otp, pending.otpHash);
  if (!otpMatches) {
    await prisma.signupOtp.update({ where: { email }, data: { attempts: { increment: 1 } } });
    throw new ApiError(401, "INVALID_OTP", "Invalid verification code");
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: pending.email }, { username: pending.username }] },
  });

  if (existing) {
    await prisma.signupOtp.delete({ where: { email } });
    const field = existing.email === pending.email ? "email" : "username";
    throw new ApiError(409, "ALREADY_REGISTERED", `That ${field} is already registered`);
  }

  // Signup can only ever create an EMPLOYEE - role promotion happens later in
  // Organization Setup -> Employee Directory, never at signup time.
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { email: pending.email, username: pending.username, name: pending.name, password: pending.password, role: "EMPLOYEE" },
    });
    await tx.signupOtp.delete({ where: { email } });
    return created;
  });

  const expires = setAuthCookie(res, user);
  return { expires, user: toSafeUser(user) };
};

const login = async (res, { email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "No account found for that email");
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError(403, "ACCOUNT_INACTIVE", "This account has been deactivated");
  }

  const passwordsMatch = await bcrypt.compare(password, user.password);
  if (!passwordsMatch) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Incorrect password");
  }

  const expires = setAuthCookie(res, user);
  return { expires, user: toSafeUser(user) };
};

const me = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "User not found");
  }
  return toSafeUser(user);
};

const forgotPassword = async ({ email }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Do not reveal whether the email exists - always respond success.
  if (!user) return;

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);

  await prisma.passwordResetOtp.upsert({
    where: { email },
    update: { otpHash, expiresAt: getOtpExpiry(), attempts: 0 },
    create: { email, otpHash, expiresAt: getOtpExpiry() },
  });

  await sendPasswordResetOtp({ to: email, otp });
};

const resetPassword = async (res, { email, otp, password }) => {
  const pending = await prisma.passwordResetOtp.findUnique({ where: { email } });

  if (!pending) {
    throw new ApiError(404, "NOT_FOUND", "No password reset was requested for that email");
  }

  if (pending.expiresAt <= new Date()) {
    await prisma.passwordResetOtp.delete({ where: { email } });
    throw new ApiError(410, "OTP_EXPIRED", "Verification code expired, request a new one");
  }

  if (pending.attempts >= 5) {
    await prisma.passwordResetOtp.delete({ where: { email } });
    throw new ApiError(429, "TOO_MANY_ATTEMPTS", "Too many verification attempts, request a new code");
  }

  const otpMatches = await verifyOtp(otp, pending.otpHash);
  if (!otpMatches) {
    await prisma.passwordResetOtp.update({ where: { email }, data: { attempts: { increment: 1 } } });
    throw new ApiError(401, "INVALID_OTP", "Invalid verification code");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({ where: { email }, data: { password: hashedPassword } });
    await tx.passwordResetOtp.delete({ where: { email } });
    return updated;
  });

  const expires = setAuthCookie(res, user);
  return { expires, user: toSafeUser(user) };
};

module.exports = {
  ApiError,
  toSafeUser,
  signup,
  verifySignup,
  login,
  me,
  forgotPassword,
  resetPassword,
};
