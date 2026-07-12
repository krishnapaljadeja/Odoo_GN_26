import apiClient from "@/lib/api";

export const bookingsApi = {
  resources: (params) => apiClient.get("/api/bookings/resources", { params }),
  list: (params) => apiClient.get("/api/bookings", { params }),
  create: (data) => apiClient.post("/api/bookings", data),
  cancel: (id) => apiClient.patch(`/api/bookings/${id}/cancel`),
  reschedule: (id, data) => apiClient.patch(`/api/bookings/${id}/reschedule`, data),
};
