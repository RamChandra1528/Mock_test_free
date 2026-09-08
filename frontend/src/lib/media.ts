import { api } from "./api";

export function resolveMediaUrl(value?: string | null) {
  if (!value || !value.startsWith("/uploads/")) return value ?? "";
  return `${String(api.defaults.baseURL).replace(/\/api\/?$/, "")}${value}`;
}

export async function uploadImage(file: File) {
  const body = new FormData();
  body.append("file", file);
  return api
    .post<{ url: string }>("/admin/media", body, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((response) => response.data.url);
}
