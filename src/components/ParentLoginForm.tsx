"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Home, Lock, Shield, Sparkles } from "lucide-react";
import { registerParentFamily, signInParent } from "@/app/actions";
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
      {pending ? t("auth.checking") : t("auth.submit")}
    </button>
  );
}

export default function ParentLoginForm() {
  const { t } = useI18n();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginState, loginAction] = useActionState(signInParent, { ok: true, message: "" });
  const [registerState, registerAction] = useActionState(registerParentFamily, { ok: true, message: "" });

  return (
    <main className="app-shell grid place-items-center">
      <section className="surface-card w-full max-w-md p-5 sm:p-6">
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Link
            href="/"
            className="action-button action-muted min-h-10 px-3 py-1"
          >
            <Home size={16} className="text-mint" />
            {t("auth.home")}
          </Link>
          <Link
            href="/admin"
            className="action-button action-primary min-h-10 px-3 py-1"
          >
            <Shield size={16} className="text-mint" />
            {t("auth.admin")}
          </Link>
          <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-2">
            <LanguageToggle compact />
            <ThemeToggle compact />
          </div>
        </div>
        <div className="mb-5">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-mint/15 text-mint">
            <Lock size={24} />
          </div>
          <h1 className="text-3xl font-black text-ink">{t("auth.parentPortal")}</h1>
          <p className="section-copy mt-2">{t("auth.parentPortalSubtitle")}</p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-[8px] bg-ink/5 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`h-10 rounded-[8px] font-black ${mode === "login" ? "bg-white text-ink shadow-sm" : "text-ink/55"}`}
          >
            {t("auth.login")}
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`h-10 rounded-[8px] font-black ${mode === "register" ? "bg-white text-ink shadow-sm" : "text-ink/55"}`}
          >
            {t("auth.newFamily")}
          </button>
        </div>

        {mode === "login" ? (
          <form action={loginAction}>
            <AuthLoadingOverlay
              title={t("auth.openingTitle")}
              message={t("auth.openingMessage")}
            />
            <input type="hidden" name="redirectTo" value="/parent" />
            <label className="block">
          <span className="field-label">{t("auth.parentNameEmail")}</span>
          <input
            name="email"
            autoComplete="username"
            placeholder="Parent name or parent@email.com"
            className="field-input"
          />
            </label>
            <label className="mt-4 block">
          <span className="field-label">{t("auth.password")}</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            className="field-input"
          />
            </label>
            <label className="mt-4 flex items-center gap-3 rounded-[8px] bg-ink/5 p-3 text-sm font-black text-ink/70">
              <input name="remember" type="checkbox" className="h-5 w-5 accent-mint" defaultChecked />
              {t("auth.remember")}
            </label>
            {!loginState.ok && <p className="mt-4 rounded-[8px] bg-coral/10 px-3 py-2 text-sm font-bold text-coral">{loginState.message}</p>}
            <SubmitButton />
          </form>
        ) : (
          <form action={registerAction}>
            <AuthLoadingOverlay
              title={t("auth.createTitle")}
              message={t("auth.createMessage")}
            />
            <label className="block">
              <span className="field-label">{t("auth.familyName")}</span>
              <input name="familyName" placeholder={t("auth.familyNamePlaceholder")} className="field-input" />
            </label>
            <label className="mt-4 block">
              <span className="field-label">{t("auth.parentName")}</span>
              <input name="parentName" placeholder={t("auth.parentNamePlaceholder")} className="field-input" />
            </label>
            <label className="mt-4 block">
              <span className="field-label">{t("auth.emailOptional")}</span>
              <input name="email" type="email" autoComplete="username" placeholder="parent@email.com" className="field-input" />
            </label>
            <label className="mt-4 block">
              <span className="field-label">{t("auth.password")}</span>
              <input name="password" type="password" autoComplete="new-password" className="field-input" />
            </label>
            <label className="mt-4 flex items-center gap-3 rounded-[8px] bg-ink/5 p-3 text-sm font-black text-ink/70">
              <input name="remember" type="checkbox" className="h-5 w-5 accent-mint" defaultChecked />
              {t("auth.remember")}
            </label>
            {!registerState.ok && <p className="mt-4 rounded-[8px] bg-coral/10 px-3 py-2 text-sm font-bold text-coral">{registerState.message}</p>}
            <button className="action-button action-mint mt-5 w-full">
              <Sparkles size={18} />
              {t("auth.create")}
            </button>
          </form>
        )}
        <div className="mt-5 flex flex-wrap gap-3 text-sm font-black text-ink/45">
          <Link href="/terms" className="hover:text-mint">{t("common.terms")}</Link>
          <Link href="/privacy" className="hover:text-mint">{t("common.privacy")}</Link>
        </div>
      </section>
    </main>
  );
}
