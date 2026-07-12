import apiClient from "@/lib/api";

export const notificationsApi = {
  list: (params) => apiClient.get("/api/notifications", { params }),
  unreadCount: () => apiClient.get("/api/notifications/unread-count"),
  markRead: (id) => apiClient.patch(`/api/notifications/${id}/read`),
  markAllRead: () => apiClient.patch("/api/notifications/read-all"),
};

export const logsApi = {
  list: (params) => apiClient.get("/api/logs", { params }),
};
