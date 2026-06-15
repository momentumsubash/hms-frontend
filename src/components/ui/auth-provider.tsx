// components/ui/auth-provider.tsx
"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getCurrentUser } from "@/lib/api";

interface AuthContextType {
  user: any;
  loading: boolean;
  error: string;
  logout: () => void;
  refreshUser: () => Promise<void>;
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
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        if (userData && typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(userData));
        }
      } catch (err: any) {
        console.error('Failed to fetch user:', err);
        setUser(null);
        setError(err.message || "Not authenticated");
        
        // Prevent multiple redirects
        if (typeof window !== "undefined" && !sessionStorage.getItem("redirected401")) {
          sessionStorage.setItem("redirected401", "1");
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchUser();
    
    // Clear redirect flag on mount (so next login works)
    return () => { 
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("redirected401");
      }
    };
  }, []);

  const refreshUser = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const userData = await getCurrentUser();
      setUser(userData);
      if (userData && typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(userData));
      }
    } catch (err: any) {
      console.error('Failed to refresh user:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  function logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      setUser(null);
      window.location.href = "/login";
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}