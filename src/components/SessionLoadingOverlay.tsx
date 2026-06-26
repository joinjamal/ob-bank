"use client";

import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function SessionLoadingOverlay({
  title,
  message,
  tone = "parent"
}: {
  title: string;
  message: string;
  tone?: "parent" | "admin";
}) {
  const { t } = useI18n();
  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-50 flex justify-center">
      <div className="session-loading-strip flex w-full max-w-md items-center gap-3 rounded-full bg-white/95 px-4 py-3 text-ink shadow-lift">
        <div
          className={`mini-vault grid h-10 w-10 shrink-0 place-items-center rounded-full ${
            tone === "admin" ? "bg-[#050914] text-white" : "bg-ink text-white"
          }`}
        >
          {tone === "admin" ? <ShieldCheck size={18} className="text-mint" /> : <LockKeyhole size={18} className="text-mint" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase text-mint">{t("common.pleaseWait")}</p>
          <h2 className="truncate text-sm font-black text-ink">{title}</h2>
          <p className="truncate text-xs font-bold text-ink/55">{message}</p>
        </div>
        <div className="loading-dots flex gap-1.5">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
