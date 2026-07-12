const express = require("express"),
  router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    message: "OK",
    payload: {
      service: "server",
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = router;
