"use client";

import { useMemo, useState } from "react";
import { Copy, Send, ShieldCheck } from "lucide-react";

export default function FamilyAccessLinkCard({
  familyName,
  token
}: {
  familyName: string;
  token: string;
}) {
  const [message, setMessage] = useState("");
  const link = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/family/${encodeURIComponent(token)}`;
  }, [token]);

  async function copyLink() {
    setMessage("");
    try {
      await navigator.clipboard.writeText(link);
      setMessage("Kid link copied.");
    } catch {
      setMessage("Copy failed. Select and copy the link below.");
    }
  }

  return (
    <section className="rounded-[8px] bg-white p-5 shadow-lift">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mint/15 text-mint">
          <Send size={21} />
        </div>
        <div>
          <h2 className="text-xl font-black">Kid device link</h2>
          <p className="text-sm font-bold text-ink/55">
            Send this to a child&apos;s device so it opens {familyName}&apos;s kid picker without the parent password.
          </p>
        </div>
      </div>

      <div className="rounded-[8px] bg-ink/5 p-3">
        <p className="break-all text-xs font-bold text-ink/55">{link}</p>
      </div>

      <button
        type="button"
        onClick={copyLink}
        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-mint font-black text-white transition hover:-translate-y-0.5"
      >
        <Copy size={17} />
        Copy kid link
      </button>

      <p className="mt-3 flex items-start gap-2 text-xs font-bold text-ink/50">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-mint" />
        This remembers only the family on that device. Each kid still needs their PIN to open their own vault.
      </p>

      {message && <p className="mt-3 rounded-[8px] bg-ink/5 px-3 py-2 text-sm font-bold text-ink/65">{message}</p>}
    </section>
  );
}
