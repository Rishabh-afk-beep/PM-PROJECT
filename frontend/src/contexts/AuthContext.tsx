import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { User } from "@/lib/types";
import { api } from "@/lib/api";
import { auth, authApi, googleProvider } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const u = await api.me();
    setUser({ ...u, role: u.role as "admin" | "student" });
  };

  useEffect(() => {
    let cancelled = false;

    // Hard deadline: stop loading no matter what after 8 seconds
    const hardTimeout = setTimeout(() => {
      if (!cancelled && loading) {
        console.warn("[Auth] Hard timeout — showing login page");
        setLoading(false);
      }
    }, 8000);

    const unsubscribe = authApi.onAuthStateChanged(auth, async (fbUser) => {
      if (cancelled) return;

      if (!fbUser) {
        console.log("[Auth] No Firebase user — showing login page");
        setUser(null);
        setLoading(false);
        return;
      }

      console.log("[Auth] Firebase user:", fbUser.email);

      try {
        await refreshUser();
        console.log("[Auth] Backend user loaded successfully");
      } catch (err) {
        console.error("[Auth] Backend /auth/me failed:", err);
        // Don't sign out — the Firebase session is valid, the backend might just be slow
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(hardTimeout);
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    await authApi.signInWithEmailAndPassword(auth, email, password);
    await refreshUser();
  };

  const register = async (name: string, email: string, phone: string, password: string) => {
    await authApi.createUserWithEmailAndPassword(auth, email, password);
    await api.register({ name, email, phone });
    await refreshUser();
  };

  const signInWithGoogle = async () => {
    const result = await authApi.signInWithPopup(auth, googleProvider);
    const profile = result.user;
    if (!profile.email) {
      throw new Error("Google account did not provide an email address.");
    }
    await api.register({
      name: profile.displayName || profile.email || "User",
      email: profile.email,
      phone: profile.phoneNumber || "",
    });
    await refreshUser();
  };

  const logout = () => {
    authApi.signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, register, signInWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
