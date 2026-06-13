"use client";

import { FormEvent, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, X } from "lucide-react";
import { Account } from "@/components/types";

type Props = {
  account: Account;
  type: "Deposit" | "Withdrawal";
  onClose: () => void;
  onSave: (payload: { accountId: string; type: "Deposit" | "Withdrawal"; amount: number; reason: string }) => Promise<void>;
};

export default function KidTransactionModal({ account, type, onClose, onSave }: Props) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const isDeposit = type === "Deposit";
  const title = isDeposit ? "Add to savings" : "Record spending";
  const Icon = isDeposit ? ArrowUpCircle : ArrowDownCircle;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter an amount bigger than zero.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        accountId: account.id,
        type,
        amount: parsedAmount,
        reason: reason.trim() || (isDeposit ? "Saved money" : "Spent money")
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="w-full max-w-sm overflow-hidden rounded-[8px] bg-white shadow-lift">
        <header className={`${isDeposit ? "bg-mint" : "bg-coral"} flex items-center justify-between p-5 text-white`}>
          <div className="flex items-center gap-3">
            <Icon size={24} />
            <div>
              <h2 className="text-xl font-black">{title}</h2>
              <p className="text-sm font-bold opacity-85">{account.name}&apos;s vault</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-white/20">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-4 p-5">
          {error && <p className="rounded-[8px] bg-coral/10 px-3 py-2 text-sm font-bold text-coral">{error}</p>}
          <label className="block">
            <span className="mb-2 block text-sm font-black text-ink/70">Amount</span>
            <input
              type="number"
              step="0.01"
              disabled={isSaving}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="25"
              className="h-12 w-full rounded-[8px] border-2 border-ink/10 px-3 text-lg font-black outline-none transition focus:border-mint"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-black text-ink/70">Reason</span>
            <input
              disabled={isSaving}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={isDeposit ? "Allowance, gift, chore..." : "Toy, snack, game..."}
              className="h-12 w-full rounded-[8px] border-2 border-ink/10 px-3 font-bold outline-none transition focus:border-mint"
            />
          </label>

          <button
            disabled={isSaving}
            className={`${isDeposit ? "bg-mint" : "bg-coral"} h-12 w-full rounded-[8px] font-black text-white shadow-sm transition hover:-translate-y-0.5 disabled:opacity-60`}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
