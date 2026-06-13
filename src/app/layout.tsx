import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-arcade"
});

export const metadata: Metadata = {
  title: "OB Bank",
  description: "A cheerful allowance bank for Basil and Osama."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={pressStart.variable}>
      <body className="font-rounded">{children}</body>
    </html>
  );
}
