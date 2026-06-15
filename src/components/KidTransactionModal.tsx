"use client";

import { FormEvent, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Sparkles, X } from "lucide-react";
import { Account } from "@/components/types";
import { useI18n } from "@/lib/i18n";

type Props = {
  account: Account;
  type: "Deposit" | "Withdrawal";
  onClose: () => void;
  onSave: (payload: { accountId: string; type: "Deposit" | "Withdrawal"; amount: number; reason: string }) => Promise<void>;
};

export default function KidTransactionModal({ account, type, onClose, onSave }: Props) {
  const { t } = useI18n();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const isDeposit = type === "Deposit";
  const title = isDeposit ? t("kidMove.addTitle") : t("kidMove.recordSpending");
  const Icon = isDeposit ? ArrowUpCircle : ArrowDownCircle;
  const amountChips = isDeposit ? [5, 10, 25, 50, 100] : [5, 10, 20, 50, 100];
  const reasonChips = isDeposit
    ? [
        t("kidMove.allowance"),
        t("kidMove.gift"),
        t("kidMove.chores"),
        t("kidMove.savedCash")
      ]
    : [t("kidMove.game"), t("kidMove.snack"), t("kidMove.book"), t("kidMove.funDay")];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError(t("kidMove.amountError"));
      return;
    }

    setIsSaving(true);
    onClose();
    void onSave({
      accountId: account.id,
      type,
      amount: parsedAmount,
      reason: reason.trim() || (isDeposit ? t("kidMove.savedMoney") : t("kidMove.spentMoney"))
    });
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
            <span className="mb-2 block text-sm font-black text-ink/70">{t("transaction.amount")}</span>
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
          <div className="flex flex-wrap gap-2">
            {amountChips.map((chip) => (
              <button
                key={chip}
                type="button"
                disabled={isSaving}
                onClick={() => setAmount(String(chip))}
                className={`h-9 rounded-[8px] px-3 text-sm font-black transition hover:-translate-y-0.5 ${
                  amount === String(chip)
                    ? isDeposit
                      ? "bg-mint text-white"
                      : "bg-coral text-white"
                    : "bg-ink/5 text-ink/65 hover:bg-ink/10"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-black text-ink/70">{t("transaction.reason")}</span>
            <input
              disabled={isSaving}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={isDeposit ? t("kidMove.reasonDepositPlaceholder") : t("kidMove.reasonWithdrawalPlaceholder")}
              className="h-12 w-full rounded-[8px] border-2 border-ink/10 px-3 font-bold outline-none transition focus:border-mint"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {reasonChips.map((chip) => (
              <button
                key={chip}
                type="button"
                disabled={isSaving}
                onClick={() => setReason(chip)}
                className={`inline-flex h-9 items-center gap-1 rounded-[8px] px-3 text-sm font-black transition hover:-translate-y-0.5 ${
                  reason === chip ? "bg-ink text-white" : "bg-ink/5 text-ink/65 hover:bg-ink/10"
                }`}
              >
                <Sparkles size={13} />
                {chip}
              </button>
            ))}
          </div>

          <button
            disabled={isSaving}
            className={`${isDeposit ? "bg-mint" : "bg-coral"} h-12 w-full rounded-[8px] font-black text-white shadow-sm transition hover:-translate-y-0.5 disabled:opacity-60`}
          >
            {isSaving ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </form>
    </div>
  );
}
