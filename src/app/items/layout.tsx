import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Items",
  description: "List / Edit and add items from your hotel"
};

export default function ItemsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}