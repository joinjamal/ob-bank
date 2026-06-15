"use client";

import { FormEvent, useEffect, useState } from "react";
import { MinusCircle, PlusCircle, Save } from "lucide-react";
import clsx from "clsx";
import { Account } from "@/components/types";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
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
      setError(t("transaction.chooseKidAmount"));
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit({ accountId, type, amount: parsedAmount, reason: reason.trim() });
      setAmount("");
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("transaction.errorSave"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="section-heading">{t("transaction.title")}</h2>
          <p className="section-copy">{t("transaction.subtitle")}</p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="field-label">{t("transaction.kid")}</span>
          <select
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            className="field-input"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="field-label">{t("transaction.typeQuestion")}</span>
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
              {t("balance.add")}
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
              {t("common.remove")}
            </button>
          </div>
        </div>

        <label className="block">
          <span className="field-label">{t("transaction.amount")}</span>
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            placeholder="25.00"
            className="field-input text-lg font-black"
          />
        </label>

        <label className="block">
          <span className="field-label">
            {t("transaction.reason")} <span className="font-bold text-ink/40">({t("common.optional")})</span>
          </span>
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t("transaction.reasonPlaceholder")}
            className="field-input"
          />
        </label>
      </div>

      {error && <p className="mt-4 rounded-[8px] bg-coral/10 px-3 py-2 text-sm font-bold text-coral">{error}</p>}

      <button
        disabled={isSaving}
        className="action-button action-primary mt-5 w-full"
      >
        <Save size={18} />
        {isSaving ? t("common.saving") : t("transaction.save")}
      </button>
    </form>
  );
}
