import apiClient from "@/lib/api";

export const allocationsApi = {
  list: (params) => apiClient.get("/api/allocations", { params }),
  allocate: (data) => apiClient.post("/api/allocations", data),
  requestReturn: (id) => apiClient.post(`/api/allocations/${id}/return-request`),
  returnAllocation: (id, data) => apiClient.post(`/api/allocations/${id}/return`, data),
};
