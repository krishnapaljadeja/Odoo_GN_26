const logService = require("../services/logService");

const list = async (req, res) => {
  try {
    return res.status(200).json({ message: "Success", payload: await logService.listLogs(req.user, req.query) });
  } catch (error) {
    return res.status(error.status || 500).json({ error: { code: error.status === 403 ? "FORBIDDEN" : "INTERNAL_ERROR", message: error.message || "Internal Server Error" } });
  }
};

module.exports = { list };
