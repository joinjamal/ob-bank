"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Lock } from "lucide-react";
import { signInAdmin } from "@/app/actions";
import AuthLoadingOverlay from "@/components/AuthLoadingOverlay";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import { useI18n } from "@/lib/i18n";

function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useI18n();

  return (
    <button
      disabled={pending}
      className="action-button action-primary mt-5 w-full"
    >
      <Lock size={18} />
      {pending ? t("auth.checking") : t("admin.enter")}
    </button>
  );
}

export default function AdminLoginForm() {
  const { t } = useI18n();
  const [state, formAction] = useActionState(signInAdmin, { ok: true, message: "" });

  return (
    <main className="super-admin-shell app-shell grid place-items-center">
      <form action={formAction} className="surface-card w-full max-w-md p-5 sm:p-6">
        <AuthLoadingOverlay
          title={t("admin.openingTitle")}
          message={t("admin.openingMessage")}
          tone="admin"
        />
        <div className="mb-5 flex justify-end gap-2">
          <LanguageToggle compact />
          <ThemeToggle compact />
        </div>
        <div className="mb-5">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-mint/15 text-mint">
            <Lock size={24} />
          </div>
          <h1 className="text-3xl font-black text-ink">{t("admin.title")}</h1>
          <p className="section-copy mt-2">{t("admin.enterPassword")}</p>
        </div>
        <label className="block">
          <span className="field-label">{t("admin.password")}</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            className="field-input"
          />
        </label>
        {!state.ok && (
          <p className="mt-4 rounded-[8px] bg-coral/10 px-3 py-2 text-sm font-bold text-coral">{state.message}</p>
        )}
        <SubmitButton />
      </form>
    </main>
  );
}
