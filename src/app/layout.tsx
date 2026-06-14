import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OB Bank",
  description: "A cheerful allowance bank for families.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "OB Bank",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  themeColor: "#3DCC91"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-rounded">{children}</body>
    </html>
  );
}
