import apiClient from "@/lib/api";

export const auditsApi = {
  list: (params) => apiClient.get("/api/audits", { params }),
  getById: (id) => apiClient.get(`/api/audits/${id}`),
  create: (data) => apiClient.post("/api/audits", data),
  updateItem: (cycleId, itemId, data) => apiClient.patch(`/api/audits/${cycleId}/items/${itemId}`, data),
  discrepancies: (id) => apiClient.get(`/api/audits/${id}/discrepancies`),
  close: (id) => apiClient.patch(`/api/audits/${id}/close`),
};
