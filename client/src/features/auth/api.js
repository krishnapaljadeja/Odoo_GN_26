import apiClient from "@/lib/api";

export const authApi = {
  signup: (data) => apiClient.post("/auth/signup", data),
  verifySignup: (data) => apiClient.post("/auth/signup/verify", data),
  login: (data) => apiClient.post("/auth/login", data),
  logout: () => apiClient.delete("/auth/logout"),
  me: () => apiClient.get("/auth/me"),
  forgotPassword: (data) => apiClient.post("/auth/forgot-password", data),
  resetPassword: (data) => apiClient.post("/auth/reset-password", data),
};
