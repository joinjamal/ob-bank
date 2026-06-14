import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    name: "OB Bank",
    short_name: "OB Bank",
    description: "A cheerful allowance bank for families.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#effaf6",
    theme_color: "#3DCC91",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable"
      }
    ]
  });
}
