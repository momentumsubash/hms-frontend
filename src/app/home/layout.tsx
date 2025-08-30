import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description: "Your Perfect Personalized Website to your Hotel"
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}