const validateTemplateCreate = (req, res, next) => {
  const name = (req.body.name || "").trim();

  if (name.length < 2) {
    return res.status(400).json({
      message: "Name must be at least 2 characters",
    });
  }

  req.body.name = name;
  return next();
};

module.exports = {
  validateTemplateCreate,
};
