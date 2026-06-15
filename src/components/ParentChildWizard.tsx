"use client";

import { FormEvent, useEffect, useState } from "react";
import { Baby, CheckCircle2, KeyRound, Plus, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function ParentChildWizard({
  open,
  onClose,
  onCreated
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("0000");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setMessage("");
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!name.trim()) {
      setMessage(t("childWizard.nameRequired"));
      return;
    }

    if (!/^\d{4,8}$/.test(pin)) {
      setMessage(t("kidPin.invalid"));
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/parent/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), pin })
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.message ?? t("childWizard.error"));
      }

      setName("");
      setPin("0000");
      await onCreated();
      onClose();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("childWizard.error"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="w-full max-w-md overflow-hidden rounded-[8px] bg-white shadow-lift">
        <header className="bg-ink p-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-mint/15 px-3 py-1 text-sm font-black text-mint">
                <Baby size={16} />
                {t("childWizard.badge")}
              </div>
              <h2 className="text-2xl font-black">{t("childWizard.title")}</h2>
              <p className="mt-1 text-sm font-bold text-white/65">{t("childWizard.subtitle")}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-white/10 text-white"
              aria-label={t("common.cancel")}
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="space-y-4 p-5">
          <div className="rounded-[8px] bg-mint/10 p-3">
            <p className="flex items-start gap-2 text-sm font-black text-ink">
              <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-mint" />
              {t("childWizard.promise")}
            </p>
          </div>

          <label className="block">
            <span className="field-label">{t("childWizard.nameLabel")}</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("kids.namePlaceholder")}
              className="field-input"
              autoFocus
            />
          </label>

          <label className="block">
            <span className="field-label">{t("childWizard.pinLabel")}</span>
            <div className="relative">
              <KeyRound size={17} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink/35" />
              <input
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 8))}
                inputMode="numeric"
                placeholder="0000"
                className="field-input ps-10"
              />
            </div>
            <p className="mt-2 text-xs font-bold text-ink/50">{t("childWizard.pinHelp")}</p>
          </label>

          {message && <p className="rounded-[8px] bg-coral/10 px-3 py-2 text-sm font-bold text-coral">{message}</p>}

          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={onClose} className="action-button action-muted">
              {t("common.cancel")}
            </button>
            <button disabled={isSaving} className="action-button action-mint">
              <Plus size={17} />
              {isSaving ? t("common.saving") : t("childWizard.create")}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
