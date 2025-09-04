import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Referrers",
  description: "Your valued referrers",
};

export default function ReferrersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}