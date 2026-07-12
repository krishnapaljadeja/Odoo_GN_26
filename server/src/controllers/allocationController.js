const allocationService = require("../services/allocationService");

const handleError = (res, error) => {
  if (error instanceof allocationService.ApiError) {
    return res.status(error.status).json({
      error: { code: error.code, message: error.message, ...(error.extra || {}) },
    });
  }

  console.error(error);
  return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error" } });
};

const allocate = async (req, res) => {
  try {
    const allocation = await allocationService.allocate(req.user.id, req.body);
    return res.status(201).json({ message: "Asset allocated", payload: allocation });
  } catch (error) {
    return handleError(res, error);
  }
};

const requestReturn = async (req, res) => {
  try {
    const allocation = await allocationService.requestReturn(req.user, Number(req.params.id));
    return res.status(200).json({ message: "Return requested", payload: allocation });
  } catch (error) {
    return handleError(res, error);
  }
};

const returnAllocation = async (req, res) => {
  try {
    const allocation = await allocationService.returnAllocation(req.user.id, Number(req.params.id), req.body);
    return res.status(200).json({ message: "Return processed", payload: allocation });
  } catch (error) {
    return handleError(res, error);
  }
};

const list = async (req, res) => {
  try {
    return res.status(200).json({ message: "Success", payload: await allocationService.listAllocations(req.query, req.user) });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = { allocate, requestReturn, returnAllocation, list };
