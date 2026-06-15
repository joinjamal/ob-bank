"use client";

import { useState } from "react";
import { Calculator, Delete } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const buttons = ["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", "0", ".", "=", "+"];

function calculate(expression: string) {
  const sanitized = expression.replaceAll("×", "*").replaceAll("÷", "/");

  if (!/^[\d+\-*/. ()]+$/.test(sanitized)) return "Error";

  try {
    const result = Function(`"use strict"; return (${sanitized})`)();
    return Number.isFinite(result) ? String(Number(result.toFixed(8))) : "Error";
  } catch {
    return "Error";
  }
}

export default function StandardCalculator() {
  const { t } = useI18n();
  const [display, setDisplay] = useState("0");

  function press(value: string) {
    if (value === "=") {
      setDisplay((current) => calculate(current));
      return;
    }

    setDisplay((current) => (current === "0" || current === "Error" ? value : `${current}${value}`));
  }

  return (
    <section className="surface-card overflow-hidden">
      <div className="night-dim-surface bg-[#FFF0BE] p-5">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-black text-ink shadow-sm">
          <Calculator size={16} className="text-[#E6A400]" />
          {t("calculator.title")}
        </div>
        <h2 className="text-2xl font-black text-ink">{t("calculator.quickMath")}</h2>
      </div>
      <div className="p-5">
        <div className="mb-3 min-h-16 rounded-[8px] bg-ink px-4 py-3 text-right text-3xl font-black text-white">
          {display}
        </div>
        <div className="mb-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDisplay("0")}
            className="action-button action-coral"
          >
            {t("calculator.clear")}
          </button>
          <button
            type="button"
            onClick={() => setDisplay((current) => (current.length > 1 ? current.slice(0, -1) : "0"))}
            className="action-button action-muted"
          >
            <Delete size={17} />
            {t("calculator.back")}
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {buttons.map((button) => (
            <button
              key={button}
              type="button"
              onClick={() => press(button)}
              className={`h-12 rounded-[8px] text-lg font-black shadow-sm transition hover:-translate-y-0.5 ${
                button === "="
                  ? "bg-mint text-white"
                  : ["+", "-", "×", "÷"].includes(button)
                    ? "bg-[#FFC64E] text-ink"
                    : "bg-ink/5 text-ink"
              }`}
            >
              {button}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
