import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OB Bank",
  description: "A cheerful allowance bank for families."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-rounded">{children}</body>
    </html>
  );
}
