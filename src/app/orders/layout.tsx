import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orders",
  description: "Create Orders and keep track of them"
};

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}