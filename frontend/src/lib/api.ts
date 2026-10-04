import axios from "axios";
import { apiErrorFromResponse } from "./errors";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api",
  timeout: 20_000,
  withCredentials: true,
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const path = String(error.config?.url ?? "");
    const status = error.response?.status as number | undefined;
    const silent = status === 401;
    if (
      status === 401 &&
      !path.includes("/auth/login") &&
      !path.includes("/auth/register") &&
      !path.includes("/auth/me")
    ) {
      window.location.href = "/login";
    }
    const fallback =
      error.code === "ECONNABORTED"
        ? "The request timed out. Check your connection and try again."
        : !error.response
          ? "We could not reach the server. Check your connection and try again."
          : "Something went wrong. Please try again.";
    return Promise.reject(
      apiErrorFromResponse(error.response?.data, fallback, status, silent),
    );
  },
);
