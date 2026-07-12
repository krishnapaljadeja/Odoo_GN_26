const authService = require("../services/authService");

const handleError = (res, error) => {
  if (error instanceof authService.ApiError) {
    return res.status(error.status).json({ error: { code: error.code, message: error.message } });
  }

  console.error(error);
  return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error" } });
};

const signup = async (req, res) => {
  try {
    const payload = await authService.signup(res, req.body);
    return res.status(201).json({ message: "Registered and logged in", payload });
  } catch (error) {
    return handleError(res, error);
  }
};

const login = async (req, res) => {
  try {
    const payload = await authService.login(res, req.body);
    return res.status(200).json({ message: "Logged in", payload });
  } catch (error) {
    return handleError(res, error);
  }
};

const logout = async (req, res) => {
  res.clearCookie("t");
  return res.status(200).json({ message: "Logged out" });
};

const me = async (req, res) => {
  try {
    const user = await authService.me(req.user.id);
    return res.status(200).json({ message: "Success", payload: user });
  } catch (error) {
    return handleError(res, error);
  }
};

const forgotPassword = async (req, res) => {
  try {
    await authService.forgotPassword(req.body);
    return res.status(200).json({ message: "If that email is registered, a verification code has been sent" });
  } catch (error) {
    return handleError(res, error);
  }
};

const resetPassword = async (req, res) => {
  try {
    const payload = await authService.resetPassword(res, req.body);
    return res.status(200).json({ message: "Password reset, logged in", payload });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  signup,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
};
