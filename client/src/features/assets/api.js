import apiClient, { api, toAbsoluteUploadUrl } from "@/lib/api";

export const assetsApi = {
  list: (params) => apiClient.get("/api/assets", { params }),
  getById: (id) => apiClient.get(`/api/assets/${id}`),
  create: (data) => apiClient.post("/api/assets", data),
  update: (id, data) => apiClient.patch(`/api/assets/${id}`, data),
  changeStatus: (id, data) => apiClient.patch(`/api/assets/${id}/status`, data),
  qrCodeUrl: (id) => toAbsoluteUploadUrl(`/api/assets/${id}/qr`),
};

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/api/uploads", formData, { headers: { "Content-Type": "multipart/form-data" } });
  return res.data.payload.url;
};
