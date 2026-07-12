import apiClient, { api } from "@/lib/api";

export const reportsApi = {
  kpis: () => apiClient.get("/api/reports/kpis"),
  utilization: (params) => apiClient.get("/api/reports/utilization", { params }),
  maintenanceFrequency: () => apiClient.get("/api/reports/maintenance-frequency"),
  mostUsed: () => apiClient.get("/api/reports/most-used"),
  idle: (params) => apiClient.get("/api/reports/idle", { params }),
  dueSoon: () => apiClient.get("/api/reports/due-soon"),
  bookingHeatmap: () => apiClient.get("/api/reports/booking-heatmap"),
  allocationSummary: () => apiClient.get("/api/reports/allocation-summary"),
  exportUrl: (type) => `${api.defaults.baseURL || ""}/api/reports/export?type=${encodeURIComponent(type)}`,
};
