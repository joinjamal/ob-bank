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
  const actionColor = isDeposit ? "bg-arcade-green text-arcade-dark" : "bg-arcade-pink text-white";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Please enter a valid amount!");
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave({
        accountId: account.id,
        type,
        amount: parsedAmount,
        reason: reason || (isDeposit ? "Found some coins!" : "Bought something cool!")
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-arcade-dark/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-xl border-4 border-white bg-arcade-bg shadow-retro font-arcade">
        <header className={`flex items-center justify-between p-4 ${actionColor}`}>
          <h2 className="text-sm uppercase tracking-widest flex items-center gap-2">
            {isDeposit ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
            {isDeposit ? "ADD COINS" : "SPEND COINS"}
          </h2>
          <button onClick={onClose} className="rounded-full bg-black/20 p-1 hover:bg-black/40">
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="text-xs text-arcade-pink font-bold bg-arcade-pink/10 p-2 rounded">{error}</p>}
          
          <div>
            <label className="mb-2 block text-xs text-white">How much?</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-white/50">$</span>
              <input
                type="number"
                step="0.01"
                required
                disabled={isSaving}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded border-2 border-white/20 bg-arcade-dark py-3 pl-8 pr-3 text-xl text-white outline-none focus:border-arcade-green"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs text-white">What for?</label>
            <input
              type="text"
              disabled={isSaving}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded border-2 border-white/20 bg-arcade-dark p-3 text-sm text-white font-rounded outline-none focus:border-arcade-green"
              placeholder={isDeposit ? "e.g. Tooth fairy" : "e.g. Video game"}
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className={`w-full rounded-lg border-b-4 border-black/20 py-4 text-sm uppercase tracking-wider shadow-sm transition hover:-translate-y-1 active:translate-y-1 active:border-b-0 ${actionColor}`}
          >
            {isSaving ? "SAVING..." : "PRESS START"}
          </button>
        </form>
      </div>
    </div>
  );
}
