import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { api, ApiError, decodeJwtExpMs, getStoredToken, setStoredToken } from "@/lib/api";

export type Role = "ADMIN" | "OPERATOR" | "MENEJER" | "SUPERVAYZER";

export type AuthUser = {
  id: number;
  ism: string;
  familiya: string;
  login: string;
  role: Role;
  active: boolean;
  createdByFullName: string | null;
  createdById: number | null;
  createdAt: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  // Token muddati tugashini FON REJIMIDA kutib turadigan taymer — foydalanuvchi hech qanday
  // amal bajarmasa ham (api.ts'dagi 401/403 tutqichi faqat haqiqiy so'rov xato qaytarganda
  // ishlaydi), aynan shu daqiqada avtomatik chiqarib yuborish uchun.
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearExpiryTimer() {
    if (expiryTimerRef.current !== null) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  }

  function forceLogoutExpired() {
    setStoredToken(null);
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login?reason=expired";
    }
  }

  // Qurilma soati (mijoz) serverniki bilan mos kelmasligi mumkin (noto'g'ri sozlangan sana/soat,
  // vaqt mintaqasi xatosi va h.k.) — shuning uchun bu taymer hech qachon MAJBURIY chiqarishning
  // YAGONA manbasi bo'lmasligi kerak, faqat ixtiyoriy/qulaylik uchun oldindan ogohlantirish.
  // Haqiqiy tekshiruv har doim serverda (JwtAuthFilter) va har bir so'rovdan keyin api.ts'dagi
  // 401 tutqichida bo'ladi — shu YAGONA haqiqiy manba.
  function scheduleExpiry(token: string) {
    clearExpiryTimer();
    const expMs = decodeJwtExpMs(token);
    if (expMs === null) return;
    const delay = expMs - Date.now();
    // Mijoz soati orqada/oldinda bo'lsa `delay` manfiy (token "allaqachon tugagan" ko'rinadi,
    // garchi server uni hozirgina yaroqli deb tasdiqlagan bo'lsa ham — masalan shu funksiya
    // login()'dan keyin chaqirilganda) yoki g'ayritabiiy katta chiqishi mumkin (setTimeout'ning
    // ~24.8 kunlik 32-bit chegarasidan oshsa, brauzer uni DARHOL ishga tushiradi — bu ham xuddi
    // shu "darhol chiqarib yuborish" xatosini teskari tomondan keltirib chiqaradi). Ikkala holatda
    // ham hech narsa rejalashtirilmaydi — foydalanuvchi ishlashda davom etadi, haqiqiy muddat
    // tugasa buni keyingi so'rovning 401 javobi aniqlaydi.
    const MAX_DELAY_MS = 24 * 60 * 60 * 1000; // 24 soat — taymer faqat yaqin kelajak uchun foydali
    if (delay <= 0 || delay > MAX_DELAY_MS) return;
    expiryTimerRef.current = setTimeout(forceLogoutExpired, delay);
  }

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<AuthUser>("/api/auth/me")
      .then((u) => {
        setUser(u);
        scheduleExpiry(token);
      })
      .catch(() => setStoredToken(null))
      .finally(() => setLoading(false));
    return clearExpiryTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(loginId: string, password: string) {
    const res = await api.post<{ token: string; user: AuthUser }>("/api/auth/login", {
      login: loginId,
      password,
    });
    setStoredToken(res.token);
    setUser(res.user);
    scheduleExpiry(res.token);
  }

  function logout() {
    clearExpiryTimer();
    setStoredToken(null);
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth AuthProvider ichida ishlatilishi kerak");
  return ctx;
}

export { ApiError };
