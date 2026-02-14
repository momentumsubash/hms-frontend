"use client";
import React from "react";
import { useAuth } from "@/components/ui/auth-provider";
import { useEffect, useState } from "react";
import Link from "next/link";

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

export const NavBar: React.FC<NavBarProps> = ({ 
  user, 
  showUserMenu, 
  setShowUserMenu, 
  logout, 
  navLinks, 
  nepaliFlag 
}) => {
  const { user: authUser, logout: authLogout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  type Role = "staff" | "manager" | "super_admin";

  interface NavLink {
    label: string;
    href: string;
    roles?: Role[];
    np?: string; // allowed roles
  }

  const displayUser = user || authUser;

  const defaultNavLinks: NavLink[] = [
    { label: "Dashboard", href: "/dashboard", np: "ड्यासबोर्ड" },
    { label: "Checkouts", href: "/checkouts", np: "चेकआउट" },
    { label: "Guests", href: "/guests", np: "अतिथि" },
    { label: "Hotels", href: "/hotels", np: "होटलहरू", roles: ["super_admin", "manager"] },
    { label: "Items", href: "/items", np: "वस्तुहरू", roles: ["super_admin", "manager"] },
    { label: "Orders", href: "/orders", np: "अर्डरहरू" },
    { label: "Rooms", href: "/rooms", np: "कोठाहरू", roles: ["super_admin", "manager"] },
    { label: "Referrers", href: "/referrers", np: "सिफारिसकर्ता", roles: ["super_admin", "manager"] },
    { label: "Stats", href: "/stats", np: "सांख्यिकी", roles: ["super_admin", "manager"] },
    { label: "Users", href: "/users", np: "प्रयोगकर्ता", roles: ["manager", "super_admin"] },
    { label: "RecordBook", href: "/recordbook", np: "रेकर्डबुक", roles: ["manager", "super_admin"] },
  ];

  // Filter by role
  const links = defaultNavLinks.filter(
    (link) =>
      !link.roles || link.roles.includes(displayUser?.role as Role)
  );

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when window resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <nav className={`sticky top-0 z-50 bg-white transition-shadow ${scrolled ? 'shadow-lg' : 'shadow'}`}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link href="/dashboard" className="font-bold text-lg sm:text-xl text-primary hover:text-primary-dark transition-colors">
              Hotel HMS
            </Link>
          </div>

          {/* Desktop Navigation Links - Hidden on mobile/tablet */}
          <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center lg:space-x-1 xl:space-x-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-primary hover:bg-gray-50 font-medium px-2 xl:px-3 py-2 rounded-md text-sm xl:text-base transition-all whitespace-nowrap"
              >
                {nepaliFlag && link.np ? (
                  <span className="flex items-center gap-1">
                    <span className="hidden xl:inline">{link.label}</span>
                    <span className="xl:hidden">{link.np}</span>
                    <span className="hidden xl:inline">({link.np})</span>
                  </span>
                ) : (
                  link.label
                )}
              </Link>
            ))}
          </div>

          {/* Right side - User menu and Mobile menu button */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* User button */}
            <div className="relative">
              <button
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs sm:text-sm font-bold">
                  {displayUser?.firstName?.charAt(0) || displayUser?.email?.charAt(0) || 'U'}
                </div>
                <span className="hidden sm:inline font-medium text-gray-700 max-w-[120px] truncate">
                  {displayUser?.firstName || displayUser?.lastName
                    ? `${displayUser?.firstName || ""} ${displayUser?.lastName || ""}`.trim()
                    : displayUser?.email || "User"}
                </span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* User dropdown menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                  <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                    <p className="text-sm font-medium text-gray-900">
                      {displayUser?.firstName || displayUser?.lastName
                        ? `${displayUser?.firstName || ""} ${displayUser?.lastName || ""}`.trim()
                        : displayUser?.email || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{displayUser?.email}</p>
                  </div>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={async () => {
                      setShowUserMenu(false);
                      setMobileMenuOpen(false);
                      await (logout || authLogout)();
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button - Only visible on mobile/tablet */}
            <button
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:text-primary hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              <span className="sr-only">Open main menu</span>
              {!mobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Navigation Menu */}
      <div className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden ${
        mobileMenuOpen ? 'max-h-[calc(100vh-4rem)] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-4 sm:px-6 py-3 bg-white border-t border-gray-200 shadow-inner">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[70vh] overflow-y-auto">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-primary hover:bg-gray-50 font-medium px-3 py-2.5 rounded-lg text-sm transition-colors text-center border border-gray-100 hover:border-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {nepaliFlag && link.np ? (
                  <div className="flex flex-col items-center">
                    <span>{link.label}</span>
                    <span className="text-xs text-gray-500">{link.np}</span>
                  </div>
                ) : (
                  link.label
                )}
              </Link>
            ))}
          </div>
          
          {/* Quick user info for mobile - if needed */}
          {mobileMenuOpen && (
            <div className="mt-4 pt-4 border-t border-gray-200 sm:hidden">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Logged in as:</span>
                <span className="text-sm font-medium text-primary">
                  {displayUser?.role || 'User'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};