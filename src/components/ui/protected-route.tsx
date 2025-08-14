"use client";
import { useAuth } from "./auth-provider";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <div className="text-red-500">You must be logged in to view this page.</div>;
  return <>{children}</>;
}
