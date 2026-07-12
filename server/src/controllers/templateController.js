const templateService = require("../services/templateService");

const list = async (req, res) => {
  try {
    const items = await templateService.list();

    return res.status(200).json({
      message: "Success",
      payload: items,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      payload: error.message,
    });
  }
};

const create = async (req, res) => {
  try {
    const item = await templateService.create(req.body);

    return res.status(201).json({
      message: "Created",
      payload: item,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      payload: error.message,
    });
  }
};

module.exports = {
  list,
  create,
};
