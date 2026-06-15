"use client";

import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useFormStatus } from "react-dom";

export default function AuthLoadingOverlay({
  title,
  message,
  tone = "parent"
}: {
  title: string;
  message: string;
  tone?: "parent" | "admin";
}) {
  const { pending } = useFormStatus();

  if (!pending) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-4 backdrop-blur-sm">
      <div className="vault-open-card w-full max-w-sm rounded-[8px] bg-white p-6 text-center shadow-lift">
        <div
          className={`vault-door mx-auto mb-5 grid h-28 w-28 place-items-center rounded-[24px] shadow-lift ${
            tone === "admin" ? "bg-[#050914] text-white" : "bg-ink text-white"
          }`}
        >
          <div className="vault-dial grid h-16 w-16 place-items-center rounded-full border-8 border-mint/70 bg-white/10">
            {tone === "admin" ? <ShieldCheck size={28} className="text-mint" /> : <LockKeyhole size={28} className="text-mint" />}
          </div>
        </div>
        <p className="text-sm font-black uppercase text-mint">Please wait</p>
        <h2 className="mt-1 text-2xl font-black text-ink">{title}</h2>
        <p className="mt-2 text-sm font-bold text-ink/55">{message}</p>
        <div className="mt-5 flex justify-center gap-2">
          <span className="vault-light h-3 w-3 rounded-full bg-mint" />
          <span className="vault-light h-3 w-3 rounded-full bg-mint" />
          <span className="vault-light h-3 w-3 rounded-full bg-mint" />
        </div>
      </div>
    </div>
  );
}
