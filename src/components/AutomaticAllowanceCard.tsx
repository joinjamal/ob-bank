"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarClock, PauseCircle, PlayCircle, Plus, Trash2 } from "lucide-react";
import type { Account, RecurringAllowance } from "@/components/types";
import { formatMoney } from "@/lib/money";

const weekDays = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" }
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
      setMessage("Automatic allowance saved.");
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
    <section className="rounded-[8px] bg-white p-5 shadow-lift">
      <div className="mb-5">
        <div className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-mint/15 text-mint">
          <CalendarClock size={21} />
        </div>
        <h2 className="text-xl font-black">Automatic allowance</h2>
        <p className="text-sm font-bold text-ink/55">Add allowance on a daily, weekly, or monthly rhythm.</p>
      </div>

      <form onSubmit={createSchedule} className="space-y-3 rounded-[8px] bg-ink/5 p-3">
        <label className="block">
          <span className="mb-2 block text-sm font-black text-ink/70">Kid</span>
          <select
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            className="h-11 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint"
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
            <span className="mb-2 block text-sm font-black text-ink/70">Amount</span>
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              placeholder="25"
              className="h-11 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-black text-ink/70">How often</span>
            <select
              value={frequency}
              onChange={(event) => setFrequency(event.target.value as RecurringAllowance["frequency"])}
              className="h-11 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint"
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </label>
        </div>

        {frequency === "Weekly" && (
          <label className="block">
            <span className="mb-2 block text-sm font-black text-ink/70">Weekly day</span>
            <select
              value={dayOfWeek}
              onChange={(event) => setDayOfWeek(Number(event.target.value))}
              className="h-11 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint"
            >
              {weekDays.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {frequency === "Monthly" && (
          <label className="block">
            <span className="mb-2 block text-sm font-black text-ink/70">Monthly day</span>
            <input
              value={dayOfMonth}
              onChange={(event) => setDayOfMonth(Number(event.target.value))}
              inputMode="numeric"
              min={1}
              max={31}
              type="number"
              className="h-11 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint"
            />
          </label>
        )}

        <button
          disabled={isSaving || accounts.length === 0}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-mint font-black text-white transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          <Plus size={17} />
          {isSaving ? "Saving..." : "Save automatic allowance"}
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {sortedSchedules.length === 0 ? (
          <p className="rounded-[8px] bg-ink/5 p-3 text-sm font-bold text-ink/55">No automatic allowances yet.</p>
        ) : (
          sortedSchedules.map((schedule) => (
            <div key={schedule.id} className="flex items-center gap-2 rounded-[8px] bg-ink/5 p-3">
              <div className="min-w-0 flex-1">
                <p className="font-black text-ink">
                  {schedule.accountName} gets {formatMoney(schedule.amount)}
                </p>
                <p className="text-xs font-bold text-ink/50">
                  {describeSchedule(schedule)}. Next: {new Date(schedule.nextRunAt).toLocaleDateString()}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => updateSchedule(schedule, !schedule.active)}
                className={`grid h-9 w-9 place-items-center rounded-[8px] ${
                  schedule.active ? "bg-mint/15 text-mint" : "bg-ink/10 text-ink/50"
                }`}
                aria-label={schedule.active ? "Pause automatic allowance" : "Resume automatic allowance"}
              >
                {schedule.active ? <PauseCircle size={17} /> : <PlayCircle size={17} />}
              </button>
              <button
                type="button"
                onClick={() => deleteSchedule(schedule)}
                className="grid h-9 w-9 place-items-center rounded-[8px] bg-coral/10 text-coral"
                aria-label="Delete automatic allowance"
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

function describeSchedule(schedule: RecurringAllowance) {
  if (!schedule.active) return "Paused";
  if (schedule.frequency === "Daily") return "Every day";
  if (schedule.frequency === "Weekly") return `Every ${weekDays.find((day) => day.value === schedule.dayOfWeek)?.label ?? "week"}`;
  return `Every month on day ${schedule.dayOfMonth ?? 1}`;
}
