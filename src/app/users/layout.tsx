import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users",
  description: "Create and manage user accounts"
};

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}