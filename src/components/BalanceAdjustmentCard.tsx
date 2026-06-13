"use client";

import { FormEvent, useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Account } from "@/components/types";
import { formatMoney } from "@/lib/money";

export default function BalanceAdjustmentCard({
  accounts,
  onAdjusted
}: {
  accounts: Account[];
  onAdjusted: () => Promise<void>;
}) {
  const [accountId, setAccountId] = useState("");
  const [targetBalance, setTargetBalance] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const account = accounts.find((item) => item.id === accountId) ?? accounts[0];

  useEffect(() => {
    if (accounts[0] && !accountId) {
      setAccountId(accounts[0].id);
      setTargetBalance(String(accounts[0].currentBalance));
    }
  }, [accountId, accounts]);

  function handleAccountChange(nextAccountId: string) {
    const nextAccount = accounts.find((item) => item.id === nextAccountId);
    setAccountId(nextAccountId);
    setTargetBalance(nextAccount ? String(nextAccount.currentBalance) : "");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!account) {
      setMessage("Choose a kid first.");
      return;
    }

    const nextBalance = Number(targetBalance);
    if (!Number.isFinite(nextBalance)) {
      setMessage("Enter a valid current balance.");
      return;
    }

    const difference = Number((nextBalance - account.currentBalance).toFixed(2));
    if (difference === 0) {
      setMessage("That is already the current balance.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: account.id,
          type: difference > 0 ? "Deposit" : "Withdrawal",
          amount: Math.abs(difference),
          reason: "Parent Adjustment"
        })
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.message ?? "Could not set the balance.");
      }

      setMessage(`Set ${account.name}'s balance to ${formatMoney(nextBalance)}.`);
      await onAdjusted();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not set the balance.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[8px] bg-white p-5 shadow-lift">
      <div className="mb-5">
        <div className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-mint/15 text-mint">
          <SlidersHorizontal size={21} />
        </div>
        <h2 className="text-xl font-black">Set current balance</h2>
        <p className="text-sm font-bold text-ink/55">
          Creates a balancing entry with reason Parent Adjustment.
        </p>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-black text-ink/70">Kid</span>
          <select
            value={account?.id ?? ""}
            onChange={(event) => handleAccountChange(event.target.value)}
            className="h-12 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-extrabold outline-none transition focus:border-mint"
          >
            {accounts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} - current {formatMoney(item.currentBalance)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-black text-ink/70">New current balance</span>
          <input
            value={targetBalance}
            onChange={(event) => setTargetBalance(event.target.value)}
            inputMode="decimal"
            placeholder="1200"
            className="h-12 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 text-lg font-black outline-none transition focus:border-mint"
          />
        </label>
      </div>

      {message && <p className="mt-4 rounded-[8px] bg-ink/5 px-3 py-2 text-sm font-bold text-ink/65">{message}</p>}

      <button
        disabled={isSaving}
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-ink px-4 font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
      >
        {isSaving ? "Saving..." : "Set balance"}
      </button>
    </form>
  );
}
