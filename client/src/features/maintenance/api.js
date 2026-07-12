import apiClient from "@/lib/api";

export const maintenanceApi = {
  list: (params) => apiClient.get("/api/maintenance", { params }),
  create: (data) => apiClient.post("/api/maintenance", data),
  approve: (id) => apiClient.patch(`/api/maintenance/${id}/approve`),
  reject: (id, data) => apiClient.patch(`/api/maintenance/${id}/reject`, data),
  assign: (id, data) => apiClient.patch(`/api/maintenance/${id}/assign`, data),
  start: (id) => apiClient.patch(`/api/maintenance/${id}/start`),
  resolve: (id, data) => apiClient.patch(`/api/maintenance/${id}/resolve`, data),
};
