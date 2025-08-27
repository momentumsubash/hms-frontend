"use client";
import React from "react";

interface NavLink {
  label: string;
  href: string;
  superAdminOnly?: boolean;
}

interface NavBarProps {
  user: any;
  showUserMenu: boolean;
  setShowUserMenu: (v: boolean) => void;
  logout: () => void | Promise<void>;
  navLinks?: NavLink[];
}




import { useEffect, useState } from "react";

export const NavBar: React.FC<NavBarProps> = ({ user, showUserMenu, setShowUserMenu, logout, navLinks }) => {
  const [localUser, setLocalUser] = useState<any>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          setLocalUser(JSON.parse(stored));
        }
      } catch {}
    }
  }, []);
type Role = "staff" | "manager" | "super_admin";

interface NavLink {
  label: string;
  href: string;
  roles?: Role[]; // allowed roles
}

const displayUser = localUser || user;

const defaultNavLinks: NavLink[] = [
  { label: "Dashboard", href: "/dashboard" }, // open to all
  { label: "Checkouts", href: "/checkouts" }, // open to all
  { label: "Guests", href: "/guests" },       // open to all
  { label: "Hotels", href: "/hotels", roles: ["super_admin","manager"] },
  { label: "Items", href: "/items" , roles: ["super_admin","manager"]},         // open to all
  { label: "Orders", href: "/orders" },       // open to all
  { label: "Rooms", href: "/rooms" , roles: ["super_admin","manager"] },         // open to all
  { label: "Stats", href: "/stats", roles: ["super_admin","manager"] },
  { label: "Users", href: "/users", roles: ["manager", "super_admin"] },
];

// filter by role
const links = defaultNavLinks.filter(
  (link) =>
    !link.roles || link.roles.includes(displayUser?.role as Role)
);

console.log(links);
  return (
    <nav className="bg-white shadow mb-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <span className="font-bold text-xl text-primary">Hotel HMS</span>
          <div className="flex items-center space-x-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-primary font-medium px-3 py-2 rounded transition-colors"
              >
                {link.label}
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
                {displayUser?.firstName || displayUser?.lastName
                  ? `${displayUser?.firstName || ""} ${displayUser?.lastName || ""}`.trim()
                  : displayUser?.email || "User"}
              </span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow z-50">
                <button
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={async () => {
                    setShowUserMenu(false);
                    await logout();
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
