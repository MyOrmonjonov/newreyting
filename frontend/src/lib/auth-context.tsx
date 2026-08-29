import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiError, getStoredToken, setStoredToken } from "@/lib/api";

export type Role = "ADMIN" | "OPERATOR" | "MENEJER" | "SUPERVAYZER";

export type AuthUser = {
  id: number;
  ism: string;
  familiya: string;
  login: string;
  role: Role;
  active: boolean;
  createdByFullName: string | null;
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

  useEffect(() => {
    if (!getStoredToken()) {
      setLoading(false);
      return;
    }
    api
      .get<AuthUser>("/api/auth/me")
      .then(setUser)
      .catch(() => setStoredToken(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(loginId: string, password: string) {
    const res = await api.post<{ token: string; user: AuthUser }>("/api/auth/login", {
      login: loginId,
      password,
    });
    setStoredToken(res.token);
    setUser(res.user);
  }

  function logout() {
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
