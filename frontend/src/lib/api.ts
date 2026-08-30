// Bo'sh — nisbiy "/api/..." yo'llar ishlatiladi, ular Vite dev serverning
// o'zidagi proksi orqali backendga yo'naltiriladi (vite.config.ts). Shu tufayli
// sayt qaysi manzildan ochilsa (localhost yoki lokal tarmoq IP'i), API so'rovi
// ham o'sha manzilga (bir xil origin) ketadi — CORS yoki "localhost telefonda
// telefonning o'zini anglatadi" muammosi bo'lmaydi.
const API_BASE = "";
const TOKEN_KEY = "micco-token";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* localStorage yo'q bo'lishi mumkin (masalan xususiy rejim) */
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `Xatolik yuz berdi (${res.status})`;
    try {
      const body = await res.json();
      const first = body?.message ?? Object.values(body ?? {})[0];
      if (typeof first === "string") message = first;
    } catch {
      /* javob JSON bo'lmasligi mumkin */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T,>(path: string, body: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T,>(path: string) => request<T>(path, { method: "DELETE" }),
};
