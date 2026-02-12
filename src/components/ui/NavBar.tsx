"use client";
import React from "react";
import { useAuth } from "@/components/ui/auth-provider";

interface NavLink {
  label: string;
  href: string;
  superAdminOnly?: boolean;
}


interface NavBarProps {
  user?: any;
  showUserMenu: boolean;
  setShowUserMenu: (v: boolean) => void;
  logout?: () => void | Promise<void>;
  navLinks?: NavLink[];
  nepaliFlag?: boolean;
}




import { useEffect, useState } from "react";

export const NavBar: React.FC<NavBarProps> = ({ user, showUserMenu, setShowUserMenu, logout, navLinks, nepaliFlag }) => {
  const { user: authUser, logout: authLogout } = useAuth();
  type Role = "staff" | "manager" | "super_admin";

interface NavLink {
  label: string;
  href: string;
  roles?: Role[];
  np?:string // allowed roles
}

const displayUser = user || authUser;


const defaultNavLinks: NavLink[] = [
  { label: "Dashboard", href: "/dashboard", np: "ड्यासबोर्ड" },
  { label: "Checkouts", href: "/checkouts", np: "चेकआउट" },
  { label: "Guests", href: "/guests", np: "अतिथि" },
  { label: "Hotels", href: "/hotels", np: "होटलहरू", roles: ["super_admin","manager"] },
  // { label: "Email Status", href: "/email-status", np: "इमेल स्थिति", roles: ["super_admin"] },
  { label: "Items", href: "/items", np: "वस्तुहरू", roles: ["super_admin","manager"] },
  { label: "Orders", href: "/orders", np: "अर्डरहरू" },
  { label: "Rooms", href: "/rooms", np: "कोठाहरू", roles: ["super_admin","manager"] },
  { label: "Referrers", href: "/referrers", np: "सिफारिसकर्ता", roles: ["super_admin","manager"] },
  { label: "Stats", href: "/stats", np: "सांख्यिकी", roles: ["super_admin","manager"] },
  { label: "Users", href: "/users", np: "प्रयोगकर्ता", roles: ["manager", "super_admin"] },
  { label: "RecordBook", href: "/recordbook", np: "रेकर्डबुक", roles: ["manager", "super_admin"] },
];

// filter by role
const links = defaultNavLinks.filter(
  (link) =>
    !link.roles || link.roles.includes(displayUser?.role as Role)
);

  return (
    <nav className="bg-white shadow mb-6">
      <div className="max-w-9xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <span className="font-bold text-xl text-primary">Hotel HMS</span>
          <div className="flex items-center space-x-8">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-primary font-medium px-3 py-2 rounded transition-colors"
              >
                {nepaliFlag && link.np ? `${link.label} (${link.np})` : link.label}
              </a>
            ))}
          </div>
          {/* User button in nav bar, now at far right */}
          <div className="relative">
            <button
              className="flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-100 border border-gray-200"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
             <span className="font-medium text-gray-700">
  {user?.firstName || user?.lastName
    ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
    : user?.email || "User"}
</span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow z-50">
                <button
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={async () => {
                    setShowUserMenu(false);
                    await (logout || authLogout)();
                  }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
