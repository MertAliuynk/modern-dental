// Mevcut (canlı) backend. Eski frontend'deki adresle birebir aynıdır;
// istekler, gövdeler ve cevap biçimleri değiştirilmeden kullanılır.
export const API = "https://dentalapi.karadenizdis.com/api";

export function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}

/** Eski frontend'in token gönderdiği isteklerde kullandığı başlık. */
export function bearer(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Backend'in `{ success, data, message }` zarfı. */
export type ApiResult<T> = { success: boolean; data: T; message?: string };

export async function getJson<T = unknown>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  const res = await fetch(url, init);
  return res.json();
}

export async function sendJson<T = unknown>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
  headers?: Record<string, string>,
): Promise<ApiResult<T>> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return res.json();
}
