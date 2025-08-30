import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Login and lets get you started"
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}