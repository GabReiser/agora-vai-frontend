import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/config/firebase";
import { fetchWithAuth } from "@/lib/api";

export type BackendProfile = {
  id: string;
  name: string;
  email: string;
  planType: "FREE" | "PRO";
  isAdmin?: boolean;
};

type AuthContextValue = {
  user: User | null;
  profile: BackendProfile | null;
  loading: boolean;
  loginState: (firebaseUser: User, backendProfile: unknown) => void;
  suppressNextAutoSync: () => void;
  setProfile: (backendProfile: BackendProfile | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getDefaultNameFromEmail(email?: string | null) {
  if (!email) return "Usuário";
  return email.split("@")[0] || "Usuário";
}

function normalizePlanType(value: unknown): BackendProfile["planType"] {
  if (typeof value !== "string") return "FREE";
  const normalized = value.toUpperCase();
  return normalized === "PRO" ? "PRO" : "FREE";
}

function normalizeProfile(raw: unknown, firebaseUser: User): BackendProfile {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const email =
    typeof input.email === "string" && input.email.trim().length > 0
      ? input.email
      : firebaseUser.email ?? "";

  const nameFromApi = typeof input.name === "string" ? input.name.trim() : "";
  const name = nameFromApi || firebaseUser.displayName || getDefaultNameFromEmail(email);

  const id =
    typeof input.id === "string"
      ? input.id
      : typeof input.userId === "string"
        ? input.userId
        : firebaseUser.uid;

  return {
    id,
    name,
    email,
    planType: normalizePlanType(input.planType ?? input.plan),
    isAdmin: Boolean(input.isAdmin),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<BackendProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const suppressNextAutoSyncRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      if (suppressNextAutoSyncRef.current) {
        suppressNextAutoSyncRef.current = false;
        setLoading(false);
        return;
      }

      try {
        const backendProfile = await fetchWithAuth<unknown>("/users/me");
        setProfile(normalizeProfile(backendProfile, firebaseUser));
      } catch {
        // Mantém a aplicação utilizável com dados mockados mesmo sem APIs completas.
        setProfile(normalizeProfile(null, firebaseUser));
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const loginState = useCallback((firebaseUser: User, backendProfile: unknown) => {
    setUser(firebaseUser);
    setProfile(normalizeProfile(backendProfile, firebaseUser));
    setLoading(false);
  }, []);

  const suppressNextAutoSync = useCallback(() => {
    suppressNextAutoSyncRef.current = true;
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginState, suppressNextAutoSync, setProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
