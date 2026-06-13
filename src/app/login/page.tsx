"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login, API_URL } from "@/lib/api";
import { Building2, Eye, EyeOff, LogIn, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.token);
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      router.push("/dashboard");
    } catch (err: any) {
      console.log("HMS_LOGIN: error:", err.message);
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[oklch(0.18_0.04_260)] via-[oklch(0.3_0.1_260)] to-[oklch(0.45_0.15_260)]">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-white/5 to-transparent blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 w-full">
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">HMS</h1>
                <p className="text-sm text-white/50">Hotel Management System</p>
              </div>
            </div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Welcome Back
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent/70 mt-1">Your Hotel Command Center</span>
            </h2>
            <p className="text-base text-white/50 leading-relaxed max-w-sm">
              Manage rooms, orders, guests, and staff from one powerful dashboard.
            </p>

            <div className="mt-12 grid grid-cols-3 gap-3">
              {[
                { value: "50+", label: "Hotels" },
                { value: "10K+", label: "Rooms" },
                { value: "99.9%", label: "Uptime" },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/40">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[oklch(0.18_0.04_260)] to-transparent" />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 sm:px-8 lg:px-12 bg-gradient-to-br from-background via-background to-secondary/50">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-10 h-10 rounded-lg bg-gradient-brand flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-foreground">HMS</span>
              <span className="block text-[10px] text-muted-foreground leading-tight">Hotel Management</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-1.5">Sign in</h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">Email</label>
              <input
                data-cy="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-11 px-4 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">Password</label>
              <div className="relative">
                <input
                  data-cy="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-11 px-4 pr-11 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-2.5 rounded-lg flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              data-cy="login-submit"
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} HMS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
