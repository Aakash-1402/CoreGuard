import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoreGuard — Risk Review Console",
  description: "Monitor supply-chain and operational risk signals for security and operations teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}