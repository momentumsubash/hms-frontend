"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/ui/auth-provider";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Toaster } from "sonner";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users,
  Bed,
  Utensils,
  ShoppingBag,
  ClipboardList,
  BookOpen,
  BarChart3,
  FileText,
  Hotel,
  UserCog,
  ChefHat,
  DollarSign,
  Receipt,
  Bell,
  Search,
  Building2,
} from "lucide-react";

interface NavLink {
  label: string;
  href: string;
  roles?: string[];
  icon?: React.ReactNode;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user: authUser, logout: authLogout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const user = authUser;

  const userRole = user?.role as string;

  const allLinks: NavLink[] = [
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" />, roles: ["staff", "manager", "super_admin"] },
    { label: "Checkouts", href: "/checkouts", icon: <Receipt className="w-5 h-5" />, roles: ["staff", "manager", "super_admin"] },
    { label: "Guests", href: "/guests", icon: <Users className="w-5 h-5" />, roles: ["staff", "manager", "super_admin"] },
    { label: "Dues", href: "/dues", icon: <DollarSign className="w-5 h-5" />, roles: ["staff", "manager", "super_admin"] },
    { label: "Hotels", href: "/hotels", icon: <Hotel className="w-5 h-5" />, roles: ["manager", "super_admin"] },
    { label: "Items", href: "/items", icon: <ShoppingBag className="w-5 h-5" />, roles: ["manager", "super_admin"] },
    { label: "Orders", href: "/orders", icon: <ClipboardList className="w-5 h-5" />, roles: ["staff", "manager", "super_admin"] },
    { label: "Rooms", href: "/rooms", icon: <Bed className="w-5 h-5" />, roles: ["manager", "super_admin"] },
    { label: "Referrers", href: "/referrers", icon: <UserCog className="w-5 h-5" />, roles: ["manager", "super_admin"] },
    { label: "Stats", href: "/stats", icon: <BarChart3 className="w-5 h-5" />, roles: ["manager", "super_admin"] },
    { label: "Users", href: "/users", icon: <UserCog className="w-5 h-5" />, roles: ["manager", "super_admin"] },
    { label: "RecordBook", href: "/recordbook", icon: <BookOpen className="w-5 h-5" />, roles: ["manager", "super_admin"] },
    { label: "Kitchen", href: "/kitchen", icon: <ChefHat className="w-5 h-5" />, roles: ["kitchen_staff", "manager", "super_admin"] },
  ];

  const links = allLinks.filter((link) => {
    if (!user) return false;
    if (link.roles) return link.roles.includes(userRole);
    return true;
  });

  const isActive = (href: string) => pathname?.startsWith(href);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await (authLogout || (() => {}))();
  };

  if (!mounted) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed z-50 h-full bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out flex flex-col ${
          sidebarCollapsed ? "w-16" : "w-64"
        } ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className={`flex h-16 items-center border-b border-sidebar-border shrink-0 ${sidebarCollapsed ? "justify-center px-0" : "justify-between px-5"}`}>
          <Link href="/" className={`flex items-center group ${sidebarCollapsed ? "justify-center" : "gap-3"}`}>
            <div className="w-9 h-9 rounded-lg bg-gradient-brand flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <span className="font-bold text-base text-white tracking-tight">HMS</span>
                <span className="block text-[10px] text-sidebar-foreground/50 leading-tight">Hotel Management</span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-sidebar-foreground/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-sidebar-accent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className={`flex-1 overflow-y-auto scrollbar-thin py-4 space-y-0.5 ${sidebarCollapsed ? "px-2" : "px-3"}`}>
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center rounded-lg text-sm font-medium transition-all duration-200 ${
                  sidebarCollapsed
                    ? "justify-center px-0 py-2.5"
                    : "gap-3 px-3 py-2.5"
                } ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
                title={sidebarCollapsed ? link.label : undefined}
              >
                <span className={`shrink-0 ${active ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/40"}`}>
                  {link.icon}
                </span>
                {!sidebarCollapsed && <span>{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {!sidebarCollapsed && (
          <div className="border-t border-sidebar-border p-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.firstName || user?.email || "User"}
                </p>
                <p className="text-xs text-sidebar-foreground/40 capitalize truncate">
                  {user?.role?.replace("_", " ") || ""}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-sidebar-border shrink-0">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex w-full items-center justify-center h-12 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      <div className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ${sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"}`}>
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
              <div className="hidden sm:flex items-center">
                <PageBreadcrumb />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive ring-2 ring-background" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-foreground leading-tight">
                      {user?.firstName || user?.email || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {user?.role?.replace("_", " ") || ""}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-popover rounded-xl shadow-elevated border border-border py-1.5 animate-scale-in z-50"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-semibold text-foreground">
                        {user?.firstName || ""} {user?.lastName || ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 animate-fade-in overflow-x-hidden">
          {children}
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
