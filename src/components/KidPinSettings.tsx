"use client";

import { FormEvent, useState } from "react";
import { KeyRound, X } from "lucide-react";
import type { Account } from "@/components/types";
import { useI18n } from "@/lib/i18n";

export default function KidPinSettings({
  account,
  variant = "card"
}: {
  account: Account;
  variant?: "card" | "button" | "icon";
}) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(variant === "card");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!/^\d{4,8}$/.test(currentPin) || !/^\d{4,8}$/.test(newPin)) {
      setMessage(t("kidPin.invalid"));
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/kids/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: account.id, currentPin, newPin })
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.message ?? "Could not update PIN.");
      }

      setCurrentPin("");
      setNewPin("");
      setMessage(t("kidPin.saved"));
      if (variant !== "card") {
        window.setTimeout(() => setIsOpen(false), 650);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update PIN.");
    } finally {
      setIsSaving(false);
    }
  }

  const form = (
    <form onSubmit={handleSubmit} className="rounded-[8px] bg-white p-5 shadow-lift">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-ink/10 text-ink">
            <KeyRound size={20} />
          </div>
          <h2 className="text-xl font-black">{t("kidPin.title")}</h2>
          <p className="text-sm font-bold text-ink/55">{t("kidPin.description")}</p>
        </div>
        {variant !== "card" && (
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-ink"
            aria-label={t("kidPin.close")}
          >
            <X size={18} />
          </button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className="mb-2 block text-sm font-black text-ink/70">{t("kidPin.current")}</span>
          <input
            value={currentPin}
            onChange={(event) => setCurrentPin(event.target.value.replace(/\D/g, "").slice(0, 8))}
            inputMode="numeric"
            type="password"
            className="h-12 w-full rounded-[8px] border-2 border-ink/10 px-3 text-lg font-black outline-none focus:border-mint"
          />
        </label>
        <label>
          <span className="mb-2 block text-sm font-black text-ink/70">{t("kidPin.new")}</span>
          <input
            value={newPin}
            onChange={(event) => setNewPin(event.target.value.replace(/\D/g, "").slice(0, 8))}
            inputMode="numeric"
            type="password"
            className="h-12 w-full rounded-[8px] border-2 border-ink/10 px-3 text-lg font-black outline-none focus:border-mint"
          />
        </label>
      </div>
      {message && <p className="mt-3 rounded-[8px] bg-ink/5 px-3 py-2 text-sm font-bold text-ink/65">{message}</p>}
      <button
        disabled={isSaving}
        className="mt-4 h-12 w-full rounded-[8px] bg-ink font-black text-white transition hover:-translate-y-0.5 disabled:opacity-60"
      >
        {isSaving ? t("common.saving") : t("kidPin.save")}
      </button>
    </form>
  );

  if (variant === "button" || variant === "icon") {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            setMessage("");
            setIsOpen(true);
          }}
          className={
            variant === "icon"
              ? "icon-button"
              : "inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-white px-3 text-sm font-black text-ink shadow-sm transition hover:-translate-y-0.5 sm:px-4 sm:text-base"
          }
          aria-label={t("kidPin.change")}
          title={t("kidPin.change")}
        >
          <KeyRound size={variant === "icon" ? 18 : 20} />
          {variant !== "icon" && t("kidPin.change")}
        </button>
        {isOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md">{form}</div>
          </div>
        )}
      </>
    );
  }

  return form;
}
