"use client";

import { useMemo, useState } from "react";
import { Copy, RefreshCw, Send, Share2, ShieldCheck, XCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function FamilyAccessLinkCard({
  familyName,
  token
}: {
  familyName: string;
  token: string;
}) {
  const { t } = useI18n();
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
      setMessage(t("familyAccess.rotateFirst"));
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setMessage(t("familyAccess.copied"));
    } catch {
      setMessage(t("familyAccess.copyFailed"));
    }
  }

  async function shareLink() {
    setMessage("");
    if (!isActive) {
      setMessage(t("familyAccess.rotateFirst"));
      return;
    }

    const shareData = {
      title: t("familyAccess.title"),
      text: t("familyAccess.shareText", { family: familyName }),
      url: link
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setMessage(t("familyAccess.ready"));
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
        setMessage(t("familyAccess.revoked"));
      } else {
        setCurrentToken(body.token);
        setIsActive(true);
        setMessage(t("familyAccess.newLink"));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update the kid link.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <section className="surface-card p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mint/15 text-mint">
          <Send size={21} />
        </div>
        <div>
          <h2 className="section-heading">{t("familyAccess.title")}</h2>
          <p className="section-copy">
            {t("familyAccess.description", { family: familyName })}
          </p>
        </div>
      </div>

      <div className="rounded-[8px] bg-ink/5 p-3">
        <p className="break-all text-xs font-bold text-ink/55">{isActive ? link : t("familyAccess.linkInactive")}</p>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={shareLink}
          disabled={!isActive}
          className="action-button action-mint w-full"
        >
          <Share2 size={17} />
          {t("familyAccess.share")}
        </button>
        <button
          type="button"
          onClick={copyLink}
          disabled={!isActive}
          className="action-button action-primary w-full"
        >
          <Copy size={17} />
          {t("familyAccess.copy")}
        </button>
      </div>

      <p className="mt-3 flex items-start gap-2 text-xs font-bold text-ink/50">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-mint" />
        {t("familyAccess.safety")}
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => updateLink("rotate")}
          disabled={isUpdating}
          className="action-button action-muted min-h-10 w-full px-3 py-1"
        >
          <RefreshCw size={16} />
          {t("familyAccess.rotate")}
        </button>
        <button
          type="button"
          onClick={() => updateLink("revoke")}
          disabled={isUpdating}
          className="action-button min-h-10 w-full bg-coral/10 px-3 py-1 text-coral hover:bg-coral hover:text-white"
        >
          <XCircle size={16} />
          {t("familyAccess.revoke")}
        </button>
      </div>

      {message && <p className="mt-3 rounded-[8px] bg-ink/5 px-3 py-2 text-sm font-bold text-ink/65">{message}</p>}
    </section>
  );
}
