const express = require("express"),
  router = express.Router(),
  bcrypt = require("bcryptjs"),
  mw = require("../../middleware"),
  { prisma } = require("../../db"),
  authService = require("../../services/authService"),
  { sendSignupOtp } = require("../../services/mailer"),
  { generateOtp, getOtpExpiry, hashOtp, verifyOtp } = require("../../services/otp");

// Optional email-verification signup path (kept alongside the primary direct
// signup at POST /auth/signup - see plan section 2.3 / 5.1). Not wired into
// the mockup UI, which uses direct signup only.

//@route    POST api/user/signup/request-otp
//@desc     Store pending signup details and email an OTP
//@access   public
router.post("/signup/request-otp", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const username = (req.body.username || "").trim();
    const name = (req.body.name || "").trim();
    const { password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({
        message: "Email, username and password are required",
      });
    }

    const existingUser = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    if (existingUser) {
      return res.status(409).json({
        message: "Email or username already in use",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);

    await prisma.signupOtp.upsert({
      where: { email },
      update: { username, name, password: hashedPassword, otpHash, expiresAt: getOtpExpiry(), attempts: 0 },
      create: { email, username, name, password: hashedPassword, otpHash, expiresAt: getOtpExpiry() },
    });

    await sendSignupOtp({ to: email, otp });

    return res.status(200).json({
      message: "Verification code sent",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      payload: error.message,
    });
  }
});

//@route    POST api/user/signup/verify-otp
//@desc     Verify signup OTP, create user and login
//@access   public
router.post("/signup/verify-otp", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const { otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const pendingSignup = await prisma.signupOtp.findUnique({ where: { email } });

    if (!pendingSignup) {
      return res.status(404).json({
        message: "No pending signup found",
      });
    }

    if (pendingSignup.expiresAt <= new Date()) {
      await prisma.signupOtp.delete({ where: { email } });
      return res.status(410).json({
        message: "Verification code expired",
      });
    }

    if (pendingSignup.attempts >= 5) {
      await prisma.signupOtp.delete({ where: { email } });
      return res.status(429).json({
        message: "Too many verification attempts",
      });
    }

    const otpMatches = await verifyOtp(otp, pendingSignup.otpHash);

    if (!otpMatches) {
      await prisma.signupOtp.update({
        where: { email },
        data: { attempts: { increment: 1 } },
      });

      return res.status(401).json({
        message: "Invalid verification code",
      });
    }

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: pendingSignup.email,
          username: pendingSignup.username,
          name: pendingSignup.name,
          password: pendingSignup.password,
          role: "EMPLOYEE",
        },
      });

      await tx.signupOtp.delete({ where: { email } });

      return createdUser;
    });

    const expiryTime = new Date((+process.env.AUTH_EXPIRES_IN_SECONDS || 604800) * 1000 + Date.now());
    const jwt = require("jsonwebtoken");
    res.cookie("t", jwt.sign({ userId: user.id }, process.env.AUTH_TOKEN_SECRET), {
      expires: expiryTime,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({
      message: "Verified, registered and logged in",
      payload: { expires: expiryTime, user: authService.toSafeUser(user) },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      payload: error.message,
    });
  }
});

//@route    GET api/user/me
//@desc     Get the details of an existing user
//@access   private
router.get("/me", [mw.auth.authenticate], async (req, res) => {
  try {
    res.status(200).json({
      message: "Success",
      payload: req.user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      payload: error.message,
    });
  }
});

module.exports = router;
