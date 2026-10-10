// Lokal dev'da bo'sh — nisbiy "/api/..." yo'llar Vite proksi orqali backendga
// ketadi (vite.config.ts). Production'da (frontend Cloudflare Pages'da, backend
// alohida AWS manzilida bo'lgani uchun) build vaqtida VITE_API_BASE muhit
// o'zgaruvchisi orqali backend manzili beriladi (masalan https://api.micco.uz).
export const API_BASE = import.meta.env["VITE_API_BASE"] ?? "";
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

/** JWT'ning "exp" (muddati tugash, soniyalarda) da'vosini millisekundda qaytaradi — token
 * imzosini TEKSHIRMAYDI (faqat o'qiydi), shuning uchun faqat UI'da "qachon avtomatik
 * chiqarib yuborish kerak" degan vaqtni bilish uchun ishlatiladi (auth-context.tsx), xavfsizlik
 * tekshiruvi uchun EMAS — haqiqiy tekshiruv har doim backendda (JwtAuthFilter) bo'ladi. */
export function decodeJwtExpMs(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(base64)) as { exp?: number };
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
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

    // 401/403 — bu backendda (SecurityConfig) deyarli har doim "sessiya tugagan/token
    // yaroqsiz" degani (haqiqiy biznes-qoida taqiqlari IllegalArgumentException orqali 409
    // bilan qaytadi, 403 bilan emas). Shuning uchun token tozalanib, foydalanuvchi avtomatik
    // login sahifasiga yo'naltiriladi — "Xatolik yuz berdi (403)" kabi tushunarsiz xabar
    // o'rniga. /api/auth/login'ning o'zi bundan mustasno — u yerda 401/403 ("login/parol
    // noto'g'ri", "hisob faol emas") aniq, foydalanuvchiga ko'rsatilishi kerak bo'lgan xabar.
    if ((res.status === 401 || res.status === 403) && path !== "/api/auth/login" && typeof window !== "undefined") {
      setStoredToken(null);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login?reason=expired";
      }
      throw new ApiError(res.status, "Sessiya muddati tugadi — qayta kiring");
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
