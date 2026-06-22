"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiLogin, apiLogout, apiGetCurrentUser } from "./api";
import type { User } from "./types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const u = apiGetCurrentUser();
    setUser(u);
    setLoading(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    const res = await apiLogin(username, password);
    if (res.success && res.data) {
      setUser(res.data.user);
      return null;
    }
    return res.message;
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
