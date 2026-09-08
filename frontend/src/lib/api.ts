import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api",
  timeout: 20_000,
  withCredentials: true,
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const path = String(error.config?.url ?? "");
    if (
      error.response?.status === 401 &&
      !path.includes("/auth/login") &&
      !path.includes("/auth/register") &&
      !path.includes("/auth/me")
    ) {
      window.location.href = "/login";
    }
    const message = Array.isArray(error.response?.data?.message)
      ? error.response.data.message.join(", ")
      : (error.response?.data?.message ??
        error.message ??
        "Something went wrong");
    return Promise.reject(new Error(message));
  },
);
