"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  getSession,
  authLogin,
  authSignup,
  authLogout,
  verifyEmail as apiVerifyEmail,
  type AuthUser,
} from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<{ email: string }>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSession()
      .then(setUser)
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      const authedUser = await authLogin(email, password, rememberMe);
      setUser(authedUser);
    },
    []
  );

  const signup = useCallback(
    async (username: string, email: string, password: string) => {
      return authSignup(username, email, password);
    },
    []
  );

  const verifyEmail = useCallback(
    async (email: string, otp: string) => {
      const authedUser = await apiVerifyEmail(email, otp);
      setUser(authedUser);
    },
    []
  );

  const logout = useCallback(async () => {
    await authLogout();
    if (typeof window !== "undefined") {
      ["taskzen_profile", "taskzen_todos", "taskzen_notes", "timerSettings",
       "taskzen_weekly_goal", "focusai_session", "focusai_users",
       "focusai_testimonials", "taskzen_notified"]
        .forEach(k => localStorage.removeItem(k));
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, verifyEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
