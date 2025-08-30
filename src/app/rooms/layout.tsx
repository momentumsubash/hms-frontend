import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rooms",
  description: "Create / Uopdate Room Records"
};

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}