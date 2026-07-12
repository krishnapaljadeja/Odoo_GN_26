import apiClient from "@/lib/api";

export const orgApi = {
  listDepartments: (params) => apiClient.get("/api/org/departments", { params }),
  createDepartment: (data) => apiClient.post("/api/org/departments", data),
  updateDepartment: (id, data) => apiClient.patch(`/api/org/departments/${id}`, data),
  updateDepartmentStatus: (id, status) => apiClient.patch(`/api/org/departments/${id}/status`, { status }),

  listCategories: (params) => apiClient.get("/api/org/categories", { params }),
  createCategory: (data) => apiClient.post("/api/org/categories", data),
  updateCategory: (id, data) => apiClient.patch(`/api/org/categories/${id}`, data),

  listEmployees: (params) => apiClient.get("/api/org/employees", { params }),
  updateEmployeeRole: (id, role) => apiClient.patch(`/api/org/employees/${id}/role`, { role }),
  updateEmployee: (id, data) => apiClient.patch(`/api/org/employees/${id}`, data),
};
