const express = require("express"),
  router = express.Router(),
  mw = require("../../middleware"),
  { upload } = require("../../middleware/upload");

router.post("/", [mw.auth.authenticate], (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: { code: "UPLOAD_ERROR", message: err.message } });
    }

    if (!req.file) {
      return res.status(400).json({ error: { code: "NO_FILE", message: "No file was uploaded" } });
    }

    return res.status(201).json({
      message: "Uploaded",
      payload: { url: `/uploads/${req.file.filename}` },
    });
  });
});

module.exports = router;
