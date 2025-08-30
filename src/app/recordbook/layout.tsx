import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Record Book",
  description: "Keep track of your daily records and notes"
};

export default function RecordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}