import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  withCredentials: true,
});

const extractApiMessage = (error) => {
  const data = error?.response?.data || error?.data || error;

  if (typeof data === "string") return data;
  return (
    data?.error?.message ||
    data?.message ||
    error?.apiMessage ||
    error?.response?.data?.error?.message ||
    error?.response?.data?.message
  );
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiMessage = extractApiMessage(error);
    if (apiMessage) {
      error.apiMessage = apiMessage;
      error.message = apiMessage;
    }
    return Promise.reject(error);
  },
);

export const getApiMessage = (error, fallback = "Something went wrong") =>
  extractApiMessage(error) || error?.message || fallback;

export const toAbsoluteUploadUrl = (url) => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `${api.defaults.baseURL || ""}${url}`;
};

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
