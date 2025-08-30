import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guests",
  description: "Create / Update Guest Records"
};

export default function GuestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}