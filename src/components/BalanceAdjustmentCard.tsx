"use client";

import { FormEvent, useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Account } from "@/components/types";
import { useI18n } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";

export default function BalanceAdjustmentCard({
  accounts,
  onAdjusted,
  apiBase = "/api/transactions"
}: {
  accounts: Account[];
  onAdjusted: () => Promise<void>;
  apiBase?: string;
}) {
  const { t } = useI18n();
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
      setMessage(t("parentAdjustment.chooseKid"));
      return;
    }

    const nextBalance = Number(targetBalance);
    if (!Number.isFinite(nextBalance)) {
      setMessage(t("parentAdjustment.invalid"));
      return;
    }

    const difference = Number((nextBalance - account.currentBalance).toFixed(2));
    if (difference === 0) {
      setMessage(t("parentAdjustment.alreadyCurrent"));
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(apiBase, {
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

      setMessage(t("parentAdjustment.saved", { name: account.name, amount: formatMoney(nextBalance) }));
      await onAdjusted();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("parentAdjustment.invalid"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card p-5">
      <div className="mb-5">
        <div className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-mint/15 text-mint">
          <SlidersHorizontal size={21} />
        </div>
        <h2 className="section-heading">{t("parentAdjustment.title")}</h2>
        <p className="section-copy">
          {t("parentAdjustment.description")}
        </p>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="field-label">{t("transaction.kid")}</span>
          <select
            value={account?.id ?? ""}
            onChange={(event) => handleAccountChange(event.target.value)}
            className="field-input"
          >
            {accounts.map((item) => (
              <option key={item.id} value={item.id}>
                {t("parentAdjustment.currentOption", { name: item.name, amount: formatMoney(item.currentBalance) })}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="field-label">{t("parentAdjustment.newBalance")}</span>
          <input
            value={targetBalance}
            onChange={(event) => setTargetBalance(event.target.value)}
            inputMode="decimal"
            placeholder="1200"
            className="field-input text-lg font-black"
          />
        </label>
      </div>

      {message && <p className="mt-4 rounded-[8px] bg-ink/5 px-3 py-2 text-sm font-bold text-ink/65">{message}</p>}

      <button
        disabled={isSaving}
        className="action-button action-primary mt-5 w-full"
      >
        {isSaving ? t("common.saving") : t("parentAdjustment.save")}
      </button>
    </form>
  );
}
