"use client";

import { FormEvent, useEffect, useState } from "react";
import { MinusCircle, PlusCircle, Save } from "lucide-react";
import clsx from "clsx";
import { Account } from "@/components/types";

type TransactionType = "Deposit" | "Withdrawal";

type Props = {
  accounts: Account[];
  preset?: { accountId: string; type: TransactionType } | null;
  onSubmit: (payload: {
    accountId: string;
    type: TransactionType;
    amount: number;
    reason?: string;
  }) => Promise<void>;
};

export default function TransactionForm({ accounts, preset, onSubmit }: Props) {
  const [accountId, setAccountId] = useState("");
  const [type, setType] = useState<TransactionType>("Deposit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (accounts[0] && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  useEffect(() => {
    if (preset) {
      setAccountId(preset.accountId);
      setType(preset.type);
    }
  }, [preset]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const parsedAmount = Number(amount);

    if (!accountId || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Choose a kid and enter a positive amount.");
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit({ accountId, type, amount: parsedAmount, reason: reason.trim() });
      setAmount("");
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the transaction.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[8px] bg-white p-5 shadow-lift">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Log a move</h2>
          <p className="text-sm font-bold text-ink/55">Deposits, withdrawals, and the why behind them.</p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-black text-ink/70">Kid</span>
          <select
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            className="h-12 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-extrabold outline-none transition focus:border-mint"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="mb-2 block text-sm font-black text-ink/70">Transaction type</span>
          <div className="grid grid-cols-2 gap-2 rounded-[8px] bg-ink/5 p-1">
            <button
              type="button"
              onClick={() => setType("Deposit")}
              className={clsx(
                "inline-flex h-11 items-center justify-center gap-2 rounded-[8px] font-black transition",
                type === "Deposit" ? "bg-mint text-white shadow-sm" : "text-ink/60 hover:bg-white"
              )}
            >
              <PlusCircle size={18} />
              Add
            </button>
            <button
              type="button"
              onClick={() => setType("Withdrawal")}
              className={clsx(
                "inline-flex h-11 items-center justify-center gap-2 rounded-[8px] font-black transition",
                type === "Withdrawal" ? "bg-coral text-white shadow-sm" : "text-ink/60 hover:bg-white"
              )}
            >
              <MinusCircle size={18} />
              Remove
            </button>
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-black text-ink/70">Amount</span>
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            placeholder="25.00"
            className="h-12 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 text-lg font-black outline-none transition focus:border-mint"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-black text-ink/70">
            Reason <span className="font-bold text-ink/40">(optional)</span>
          </span>
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Weekly allowance, toy, book..."
            className="h-12 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none transition focus:border-mint"
          />
        </label>
      </div>

      {error && <p className="mt-4 rounded-[8px] bg-coral/10 px-3 py-2 text-sm font-bold text-coral">{error}</p>}

      <button
        disabled={isSaving}
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-ink px-4 font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Save size={18} />
        {isSaving ? "Saving..." : "Save transaction"}
      </button>
    </form>
  );
}
