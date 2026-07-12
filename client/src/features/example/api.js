import apiClient from "@/lib/api";

export const exampleApi = {
  list: () => apiClient.get("/api/template"),
  create: (data) => apiClient.post("/api/template", data),
};
