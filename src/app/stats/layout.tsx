import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stats",
  description: "All of your Hotel stats in one place"
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}