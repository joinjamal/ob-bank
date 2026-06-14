"use client";

import { useMemo, useState } from "react";
import { Copy, RefreshCw, Send, Share2, ShieldCheck, XCircle } from "lucide-react";

export default function FamilyAccessLinkCard({
  familyName,
  token
}: {
  familyName: string;
  token: string;
}) {
  const [message, setMessage] = useState("");
  const [currentToken, setCurrentToken] = useState(token);
  const [isActive, setIsActive] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const link = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/family/${encodeURIComponent(currentToken)}`;
  }, [currentToken]);

  async function copyLink() {
    setMessage("");
    if (!isActive) {
      setMessage("Rotate the link before sharing it again.");
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setMessage("Kid link copied.");
    } catch {
      setMessage("Copy failed. Select and copy the link below.");
    }
  }

  async function shareLink() {
    setMessage("");
    if (!isActive) {
      setMessage("Rotate the link before sharing it again.");
      return;
    }

    const shareData = {
      title: "OB Bank kid link",
      text: `Open ${familyName}'s OB Bank kid vault picker.`,
      url: link
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setMessage("Ready to open on the kid's device.");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    await copyLink();
  }

  async function updateLink(action: "rotate" | "revoke") {
    setMessage("");
    setIsUpdating(true);
    try {
      const response = await fetch("/api/parent/family-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message ?? "Could not update the kid link.");

      if (action === "revoke") {
        setIsActive(false);
        setMessage("Kid link revoked. Rotate to create a new one.");
      } else {
        setCurrentToken(body.token);
        setIsActive(true);
        setMessage("New kid link created.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update the kid link.");
    } finally {
      setIsUpdating(false);
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
        <p className="break-all text-xs font-bold text-ink/55">{isActive ? link : "This kid link is revoked."}</p>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={shareLink}
          disabled={!isActive}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-mint font-black text-white transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          <Share2 size={17} />
          Share to kid
        </button>
        <button
          type="button"
          onClick={copyLink}
          disabled={!isActive}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-ink font-black text-white transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          <Copy size={17} />
          Copy link
        </button>
      </div>

      <p className="mt-3 flex items-start gap-2 text-xs font-bold text-ink/50">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-mint" />
        This remembers only the family on that device. Each kid still needs their PIN to open their own vault.
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => updateLink("rotate")}
          disabled={isUpdating}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-ink/5 font-black text-ink transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          <RefreshCw size={16} />
          Rotate link
        </button>
        <button
          type="button"
          onClick={() => updateLink("revoke")}
          disabled={isUpdating}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-coral/10 font-black text-coral transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          <XCircle size={16} />
          Revoke link
        </button>
      </div>

      {message && <p className="mt-3 rounded-[8px] bg-ink/5 px-3 py-2 text-sm font-bold text-ink/65">{message}</p>}
    </section>
  );
}
