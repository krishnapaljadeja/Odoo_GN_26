const transferService = require("../services/transferService");

const handleError = (res, error) => {
  if (error instanceof transferService.ApiError) {
    return res.status(error.status).json({ error: { code: error.code, message: error.message } });
  }

  console.error(error);
  return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error" } });
};

const create = async (req, res) => {
  try {
    const transfer = await transferService.createTransfer(req.user, req.body);
    return res.status(201).json({ message: "Transfer requested", payload: transfer });
  } catch (error) {
    return handleError(res, error);
  }
};

const approve = async (req, res) => {
  try {
    const transfer = await transferService.approveTransfer(req.user, Number(req.params.id));
    return res.status(200).json({ message: "Transfer approved", payload: transfer });
  } catch (error) {
    return handleError(res, error);
  }
};

const reject = async (req, res) => {
  try {
    const transfer = await transferService.rejectTransfer(req.user, Number(req.params.id), req.body.note);
    return res.status(200).json({ message: "Transfer rejected", payload: transfer });
  } catch (error) {
    return handleError(res, error);
  }
};

const list = async (req, res) => {
  try {
    return res.status(200).json({ message: "Success", payload: await transferService.listTransfers(req.query, req.user) });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = { create, approve, reject, list };
