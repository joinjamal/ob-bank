"use client";

import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  const nextLocale = locale === "en" ? "ar" : "en";

  return (
    <button
      type="button"
      onClick={() => setLocale(nextLocale)}
      className="action-button action-quiet px-3"
      aria-label={t("common.language")}
      title={t("common.language")}
    >
      <Languages size={17} className="text-mint" />
      {!compact && <span>{locale === "en" ? "العربية" : "English"}</span>}
      {compact && <span>{locale === "en" ? "ع" : "EN"}</span>}
    </button>
  );
}
