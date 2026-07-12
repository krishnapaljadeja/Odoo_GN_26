import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  withCredentials: true,
});

export const getApiMessage = (error, fallback = "Something went wrong") =>
  error?.response?.data?.message || error?.message || fallback;

export const request = async (config) => {
  const response = await api.request(config);
  return response.data;
};

export const apiClient = {
  get: (url, config) => request({ ...config, method: "GET", url }),
  post: (url, data, config) => request({ ...config, method: "POST", url, data }),
  put: (url, data, config) => request({ ...config, method: "PUT", url, data }),
  patch: (url, data, config) => request({ ...config, method: "PATCH", url, data }),
  delete: (url, config) => request({ ...config, method: "DELETE", url }),
};

export default apiClient;
