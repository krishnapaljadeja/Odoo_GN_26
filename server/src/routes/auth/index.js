const express = require("express"),
  router = express.Router(),
  mw = require("../../middleware"),
  authController = require("../../controllers/authController"),
  {
    validateSignup,
    validateLogin,
    validateForgotPassword,
    validateResetPassword,
  } = require("../../validators/authValidator");

router.post("/signup", [validateSignup], authController.signup);
router.post("/login", [validateLogin], authController.login);
router.delete("/logout", [mw.auth.authenticate], authController.logout);
router.get("/me", [mw.auth.authenticate], authController.me);
router.post("/forgot-password", [validateForgotPassword], authController.forgotPassword);
router.post("/reset-password", [validateResetPassword], authController.resetPassword);

module.exports = router;
