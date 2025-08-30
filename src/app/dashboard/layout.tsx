import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard", // Replace with: Dashboard, Guests, Items, etc.
  description: "Our Hotel Dashboard" // Replace with relevant description
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}