import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkouts",
  description: "Complete your booking securely"
};

export default function CheckoutsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}