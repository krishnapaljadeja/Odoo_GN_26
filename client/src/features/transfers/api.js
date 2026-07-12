import apiClient from "@/lib/api";

export const transfersApi = {
  list: (params) => apiClient.get("/api/transfers", { params }),
  create: (data) => apiClient.post("/api/transfers", data),
  approve: (id) => apiClient.patch(`/api/transfers/${id}/approve`),
  reject: (id, note) => apiClient.patch(`/api/transfers/${id}/reject`, { note }),
};
