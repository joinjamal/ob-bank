"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily:
          '"Nunito", system-ui, -apple-system, sans-serif',
        background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)",
        color: "#1a1a2e"
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: "420px",
          padding: "2.5rem",
          borderRadius: "16px",
          background: "white",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)"
        }}
      >
        <p style={{ fontSize: "3rem", margin: "0 0 0.5rem" }}>🏦</p>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 900,
            margin: "0 0 0.75rem",
            color: "#1a1a2e"
          }}
        >
          OB Bank needs a moment
        </h2>
        <p
          style={{
            fontSize: "0.95rem",
            lineHeight: 1.6,
            color: "#64748b",
            margin: "0 0 1.5rem"
          }}
        >
          Something went wrong loading the page. This usually means our database
          is waking up — please try again in a few seconds.
        </p>
        <button
          onClick={reset}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.5rem",
            fontSize: "0.95rem",
            fontWeight: 800,
            color: "white",
            background: "#3DCC91",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
            boxShadow: "0 2px 8px rgba(61,204,145,0.3)"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(61,204,145,0.4)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(61,204,145,0.3)";
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
