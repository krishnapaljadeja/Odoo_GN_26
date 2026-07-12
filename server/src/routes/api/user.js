const express = require("express"),
 router = express.Router(),
 bcrypt = require("bcryptjs"),
 jwt = require("jsonwebtoken"),
 mw = require("../../middleware"),
 { prisma } = require("../../db"),
 { sendSignupOtp } = require("../../services/mailer"),
 { generateOtp, getOtpExpiry, hashOtp, verifyOtp } = require("../../services/otp");

const setAuthCookie = (res, authenticated_user) => {
  const token = jwt.sign(
    {
      user: authenticated_user,
    },
    process.env.AUTH_TOKEN_SECRET
  );
  const expiryTime = new Date(+process.env.AUTH_EXPIRES_IN_SECONDS * 1000 + Date.now());

  res.cookie("t", token, {
    expires: expiryTime,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return expiryTime;
};

const toAuthenticatedUser = (user) => ({
  id: user.id,
  email: user.login_id || user.loginId,
  username: user.first_name || user.firstName,
  login_id: user.login_id || user.loginId,
  first_name: user.first_name || user.firstName,
  last_name: user.last_name || user.lastName,
});

//@route    POST api/user
//@desc     Create a new user
//@access   public
router.post("/", async (req, res) => {
  try {
    const login_id = (req.body.login_id || req.body.email || "").trim().toLowerCase();
    const first_name = (req.body.first_name || req.body.username || "").trim();
    const { password, last_name } = req.body;

    if (!login_id || !first_name || !password) {
      return res.status(400).json({
        message: "Email, username and password are required",
      });
    }

    //Check and notify if user already exists
    const existingUser = await mw.db.getUserByLoginId(login_id);

    if (existingUser) {
      return res.status(409).json({
        message: "Login id already in use",
      });
    }

    //Encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashed_password = await bcrypt.hash(password, salt);

    //Insert new user to the table and store the newUser in a variable
    const newUser = await mw.db.addNewUser(login_id, hashed_password, first_name, last_name);

    //Prepare user info to be sent to client and for access token
    const authenticated_user = {
      id: newUser.id,
      email: newUser.login_id,
      username: newUser.first_name,
      login_id: newUser.login_id,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
    };

    const expiryTime = setAuthCookie(res, authenticated_user);

    return res.status(200).json({
      message: "Registered & logged in",
      payload: {
        expires: expiryTime,
        user: authenticated_user,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      payload: error,
    });
  }
});

//@route    POST api/user/signup/request-otp
//@desc     Store pending signup details and email an OTP
//@access   public
router.post("/signup/request-otp", async (req, res) => {
  try {
    const login_id = (req.body.login_id || req.body.email || "").trim().toLowerCase();
    const first_name = (req.body.first_name || req.body.username || "").trim();
    const { password, last_name } = req.body;

    if (!login_id || !password || !first_name) {
      return res.status(400).json({
        message: "Email, username and password are required",
      });
    }

    const existingUser = await mw.db.getUserByLoginId(login_id);

    if (existingUser) {
      return res.status(409).json({
        message: "Login id already in use",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed_password = await bcrypt.hash(password, salt);
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);

    await prisma.signupOtp.upsert({
      where: {
        loginId: login_id,
      },
      update: {
        hashedPassword: hashed_password,
        firstName: first_name,
        lastName: last_name || null,
        otpHash,
        expiresAt: getOtpExpiry(),
        attempts: 0,
      },
      create: {
        loginId: login_id,
        hashedPassword: hashed_password,
        firstName: first_name,
        lastName: last_name || null,
        otpHash,
        expiresAt: getOtpExpiry(),
      },
    });

    await sendSignupOtp({ to: login_id, otp });

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
    const { login_id, otp } = req.body;

    if (!login_id || !otp) {
      return res.status(400).json({
        message: "Login id and OTP are required",
      });
    }

    const pendingSignup = await prisma.signupOtp.findUnique({
      where: {
        loginId: login_id,
      },
    });

    if (!pendingSignup) {
      return res.status(404).json({
        message: "No pending signup found",
      });
    }

    if (pendingSignup.expiresAt <= new Date()) {
      await prisma.signupOtp.delete({ where: { loginId: login_id } });
      return res.status(410).json({
        message: "Verification code expired",
      });
    }

    if (pendingSignup.attempts >= 5) {
      await prisma.signupOtp.delete({ where: { loginId: login_id } });
      return res.status(429).json({
        message: "Too many verification attempts",
      });
    }

    const otpMatches = await verifyOtp(otp, pendingSignup.otpHash);

    if (!otpMatches) {
      await prisma.signupOtp.update({
        where: {
          loginId: login_id,
        },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      return res.status(401).json({
        message: "Invalid verification code",
      });
    }

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          loginId: pendingSignup.loginId,
          hashedPassword: pendingSignup.hashedPassword,
          firstName: pendingSignup.firstName,
          lastName: pendingSignup.lastName,
          emailVerified: true,
        },
      });

      await tx.signupOtp.delete({
        where: {
          loginId: login_id,
        },
      });

      return createdUser;
    });

    const authenticated_user = toAuthenticatedUser(user);
    const expiryTime = setAuthCookie(res, authenticated_user);

    return res.status(200).json({
      message: "Verified, registered and logged in",
      payload: {
        expires: expiryTime,
        user: authenticated_user,
      },
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
router.get("/me", [mw.auth.authenticate], async (req,res) => {
  try {
    res.status(200).json({
      message: "Success",
      payload: req.user
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      payload: error,
    });
  }
});

//@route    PUT api/user/:id
//@desc     Update the details of an existing user
//@access   private

//@route    DELETE api/user/:id
//@desc     Delete an existing user
//@access   private

//Export router
module.exports = router;
