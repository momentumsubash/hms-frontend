import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hotels",
  description: "Find and book the perfect hotel"
};

export default function HotelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}