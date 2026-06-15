"use client";

import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import type { Account, RecurringAllowance } from "@/components/types";

export default function ParentOnboardingCard({
  accounts,
  allowances
}: {
  accounts: Account[];
  allowances: RecurringAllowance[];
}) {
  const steps = [
    { label: "Create your family", done: true },
    { label: "Add kid profiles", done: accounts.length > 0 },
    { label: "Set a regular allowance", done: allowances.some((allowance) => allowance.active) },
    { label: "Share the kid device link", done: false }
  ];
  const completeCount = steps.filter((step) => step.done).length;

  return (
    <section className="surface-card p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mint/15 text-mint">
          <Sparkles size={21} />
        </div>
        <div>
          <h2 className="section-heading">Family setup</h2>
          <p className="section-copy">{completeCount} of {steps.length} starter steps complete.</p>
        </div>
      </div>
      <div className="space-y-2">
        {steps.map((step) => {
          const Icon = step.done ? CheckCircle2 : Circle;
          return (
            <div key={step.label} className="flex items-center gap-2 rounded-[8px] bg-ink/5 p-3">
              <Icon size={18} className={step.done ? "text-mint" : "text-ink/35"} />
              <p className={`font-black ${step.done ? "text-ink" : "text-ink/50"}`}>{step.label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
