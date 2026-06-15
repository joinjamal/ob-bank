"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarClock, PauseCircle, PlayCircle, Plus, Trash2 } from "lucide-react";
import type { Account, RecurringAllowance } from "@/components/types";
import { useI18n } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";

const weekDays = [
  { value: 0, labelKey: "day.sunday" },
  { value: 1, labelKey: "day.monday" },
  { value: 2, labelKey: "day.tuesday" },
  { value: 3, labelKey: "day.wednesday" },
  { value: 4, labelKey: "day.thursday" },
  { value: 5, labelKey: "day.friday" },
  { value: 6, labelKey: "day.saturday" }
];

export default function AutomaticAllowanceCard({
  accounts,
  schedules,
  onChanged
}: {
  accounts: Account[];
  schedules: RecurringAllowance[];
  onChanged: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [frequency, setFrequency] = useState<RecurringAllowance["frequency"]>("Weekly");
  const [amount, setAmount] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(5);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!accounts.some((account) => account.id === accountId)) {
      setAccountId(accounts[0]?.id ?? "");
    }
  }, [accountId, accounts]);

  const sortedSchedules = useMemo(
    () => [...schedules].sort((a, b) => Number(b.active) - Number(a.active) || a.nextRunAt.localeCompare(b.nextRunAt)),
    [schedules]
  );

  async function createSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSaving(true);
    try {
      const response = await fetch("/api/parent/allowances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          frequency,
          amount: Number(amount),
          dayOfWeek,
          dayOfMonth
        })
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.message ?? "Could not create automatic allowance.");
      }

      setAmount("");
      setMessage(t("allowance.created"));
      await onChanged();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create automatic allowance.");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateSchedule(schedule: RecurringAllowance, active: boolean) {
    setMessage("");
    const response = await fetch(`/api/parent/allowances/${schedule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active })
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(body?.message ?? "Could not update automatic allowance.");
      return;
    }
    await onChanged();
  }

  async function deleteSchedule(schedule: RecurringAllowance) {
    setMessage("");
    const response = await fetch(`/api/parent/allowances/${schedule.id}`, { method: "DELETE" });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(body?.message ?? "Could not delete automatic allowance.");
      return;
    }
    await onChanged();
  }

  return (
    <section className="surface-card p-5">
      <div className="mb-5">
        <div className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-mint/15 text-mint">
          <CalendarClock size={21} />
        </div>
        <h2 className="section-heading">{t("allowance.title")}</h2>
        <p className="section-copy">{t("allowance.description")}</p>
      </div>

      <form onSubmit={createSchedule} className="space-y-3 rounded-[8px] bg-ink/5 p-3">
        <label className="block">
          <span className="field-label">{t("transaction.kid")}</span>
          <select
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            className="field-input h-11"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">{t("transaction.amount")}</span>
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              placeholder="25"
              className="field-input h-11"
            />
          </label>
          <label className="block">
            <span className="field-label">{t("allowance.frequency")}</span>
            <select
              value={frequency}
              onChange={(event) => setFrequency(event.target.value as RecurringAllowance["frequency"])}
              className="field-input h-11"
            >
              <option value="Daily">{t("allowance.daily")}</option>
              <option value="Weekly">{t("allowance.weekly")}</option>
              <option value="Monthly">{t("allowance.monthly")}</option>
            </select>
          </label>
        </div>

        {frequency === "Weekly" && (
          <label className="block">
            <span className="field-label">{t("allowance.weeklyDay")}</span>
            <select
              value={dayOfWeek}
              onChange={(event) => setDayOfWeek(Number(event.target.value))}
              className="field-input h-11"
            >
              {weekDays.map((day) => (
                <option key={day.value} value={day.value}>
                  {t(day.labelKey)}
                </option>
              ))}
            </select>
          </label>
        )}

        {frequency === "Monthly" && (
          <label className="block">
            <span className="field-label">{t("allowance.monthlyDay")}</span>
            <input
              value={dayOfMonth}
              onChange={(event) => setDayOfMonth(Number(event.target.value))}
              inputMode="numeric"
              min={1}
              max={31}
              type="number"
              className="field-input h-11"
            />
          </label>
        )}

        <button
          disabled={isSaving || accounts.length === 0}
          className="action-button action-mint w-full"
        >
          <Plus size={17} />
          {isSaving ? t("common.saving") : t("allowance.save")}
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {sortedSchedules.length === 0 ? (
          <p className="rounded-[8px] bg-ink/5 p-3 text-sm font-bold text-ink/55">{t("allowance.empty")}</p>
        ) : (
          sortedSchedules.map((schedule) => (
            <div key={schedule.id} className="flex items-center gap-2 rounded-[8px] bg-ink/5 p-3">
              <div className="min-w-0 flex-1">
                <p className="font-black text-ink">
                  {t("allowance.gets", { name: schedule.accountName, amount: formatMoney(schedule.amount) })}
                </p>
                <p className="text-xs font-bold text-ink/50">
                  {describeSchedule(schedule, t)}. {t("allowance.next", { date: new Date(schedule.nextRunAt).toLocaleDateString() })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => updateSchedule(schedule, !schedule.active)}
                className={`grid h-9 w-9 place-items-center rounded-[8px] ${
                  schedule.active ? "bg-mint/15 text-mint" : "bg-ink/10 text-ink/50"
                }`}
                aria-label={schedule.active ? t("allowance.pauseAria") : t("allowance.resumeAria")}
              >
                {schedule.active ? <PauseCircle size={17} /> : <PlayCircle size={17} />}
              </button>
              <button
                type="button"
                onClick={() => deleteSchedule(schedule)}
                className="grid h-9 w-9 place-items-center rounded-[8px] bg-coral/10 text-coral"
                aria-label={t("allowance.deleteAria")}
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))
        )}
      </div>

      {message && <p className="mt-4 rounded-[8px] bg-ink/5 px-3 py-2 text-sm font-bold text-ink/65">{message}</p>}
    </section>
  );
}

function describeSchedule(schedule: RecurringAllowance, t: (key: string, replacements?: Record<string, string | number>) => string) {
  if (!schedule.active) return t("allowance.paused");
  if (schedule.frequency === "Daily") return t("allowance.everyDay");
  if (schedule.frequency === "Weekly") {
    const dayKey = weekDays.find((day) => day.value === schedule.dayOfWeek)?.labelKey ?? "day.friday";
    return t("allowance.everyWeek", { day: t(dayKey) });
  }
  return t("allowance.everyMonth", { day: schedule.dayOfMonth ?? 1 });
}
