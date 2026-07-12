const express = require("express"),
  router = express.Router(),
  bcrypt = require("bcryptjs"),
  jwt = require("jsonwebtoken"),
  mw = require("../../middleware");

const getAuthSecret = () => {
  if (!process.env.AUTH_TOKEN_SECRET) {
    throw new Error("AUTH_TOKEN_SECRET is not configured");
  }

  return process.env.AUTH_TOKEN_SECRET;
};

const getCookieExpiry = () =>
  new Date((+process.env.AUTH_EXPIRES_IN_SECONDS || 604800) * 1000 + Date.now());

const toAuthenticatedUser = (user) => ({
  id: user.id,
  email: user.login_id || user.loginId,
  username: user.first_name || user.firstName,
  login_id: user.login_id || user.loginId,
  first_name: user.first_name || user.firstName,
  last_name: user.last_name || user.lastName || null,
});

const setAuthCookie = (res, authenticatedUser) => {
  const expiryTime = getCookieExpiry();
  const token = jwt.sign({ user: authenticatedUser }, getAuthSecret());

  res.cookie("t", token, {
    expires: expiryTime,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return expiryTime;
};

const createAuthPayload = (res, user) => {
  const authenticatedUser = toAuthenticatedUser(user);
  const expires = setAuthCookie(res, authenticatedUser);

  return {
    expires,
    user: authenticatedUser,
  };
};

router.post("/signup", async (req, res) => {
  try {
    const email = (req.body.email || req.body.login_id || "").trim().toLowerCase();
    const username = (req.body.username || req.body.first_name || "").trim();
    const password = req.body.password || "";

    if (!email || !username || !password) {
      return res.status(400).json({
        message: "Email, username and password are required",
      });
    }

    const existingUser = await mw.db.getUserByLoginId(email);
    if (existingUser) {
      return res.status(409).json({
        message: "Email already in use",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await mw.db.addNewUser(email, hashedPassword, username, null);

    return res.status(201).json({
      message: "Registered and logged in",
      payload: createAuthPayload(res, newUser),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      payload: error.message,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = (req.body.email || req.body.login_id || "").trim().toLowerCase();
    const password = req.body.password || "";

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await mw.db.getUserByLoginId(email);
    if (!user) {
      return res.status(404).json({
        message: "No such user",
      });
    }

    const passwordsMatch = await bcrypt.compare(password, user.hashed_password);
    if (!passwordsMatch) {
      return res.status(401).json({
        message: "Incorrect password",
      });
    }

    return res.status(200).json({
      message: "Logged in",
      payload: createAuthPayload(res, user),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      payload: error.message,
    });
  }
});

router.delete("/logout", [mw.auth.authenticate], async (req, res) => {
  try {
    res.clearCookie("t");
    return res.status(200).json({
      message: "Logged out",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      payload: error.message,
    });
  }
});

router.get("/me", [mw.auth.authenticate], async (req, res) => {
  try {
    return res.status(200).json({
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
