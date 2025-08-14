"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getCurrentUser } from "@/lib/api";

interface AuthContextType {
  user: any;
  loading: boolean;
  error: string;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      setError("");
      try {
        const data = await getCurrentUser();
        setUser(data.user || data);
      } catch (err: any) {
        setUser(null);
        setError(err.message || "Not authenticated");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
    window.location.reload();
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
