const QRCode = require("qrcode");
const assetService = require("../services/assetService");

const handleError = (res, error) => {
  if (error instanceof assetService.ApiError) {
    return res.status(error.status).json({ error: { code: error.code, message: error.message } });
  }

  console.error(error);
  return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error" } });
};

const list = async (req, res) => {
  try {
    return res.status(200).json({ message: "Success", payload: await assetService.listAssets(req.query) });
  } catch (error) {
    return handleError(res, error);
  }
};

const getById = async (req, res) => {
  try {
    const asset = await assetService.getAssetById(Number(req.params.id));
    return res.status(200).json({ message: "Success", payload: asset });
  } catch (error) {
    return handleError(res, error);
  }
};

const create = async (req, res) => {
  try {
    const asset = await assetService.createAsset(req.user.id, req.body);
    return res.status(201).json({ message: "Asset registered", payload: asset });
  } catch (error) {
    return handleError(res, error);
  }
};

const update = async (req, res) => {
  try {
    const asset = await assetService.updateAsset(req.user.id, Number(req.params.id), req.body);
    return res.status(200).json({ message: "Asset updated", payload: asset });
  } catch (error) {
    return handleError(res, error);
  }
};

const changeStatus = async (req, res) => {
  try {
    const asset = await assetService.changeAssetStatus(req.user.id, Number(req.params.id), req.body);
    return res.status(200).json({ message: "Asset status updated", payload: asset });
  } catch (error) {
    return handleError(res, error);
  }
};

const getQrCode = async (req, res) => {
  try {
    const asset = await assetService.getAssetById(Number(req.params.id));
    const buffer = await QRCode.toBuffer(asset.assetTag, { width: 240, margin: 1 });
    res.set("Content-Type", "image/png");
    return res.status(200).send(buffer);
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = { list, getById, create, update, changeStatus, getQrCode };
