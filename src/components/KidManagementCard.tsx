"use client";

import { FormEvent, useState } from "react";
import { KeyRound, Plus, Trash2, UsersRound } from "lucide-react";
import type { Account } from "@/components/types";
import { useI18n } from "@/lib/i18n";

export default function KidManagementCard({
  accounts,
  onChanged,
  apiBase = "/api/accounts"
}: {
  accounts: Account[];
  onChanged: () => Promise<void>;
  apiBase?: string;
}) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [initialPin, setInitialPin] = useState("0000");
  const [resetAccountId, setResetAccountId] = useState(accounts[0]?.id ?? "");
  const [resetPin, setResetPin] = useState("0000");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const selectedResetAccount = accounts.find((account) => account.id === resetAccountId) ?? accounts[0];

  async function createKid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, pin: initialPin })
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.message ?? "Could not add kid.");
      }

      setName("");
      setInitialPin("0000");
      setMessage(t("kids.added", { name: body.name }));
      await onChanged();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add kid.");
    } finally {
      setIsSaving(false);
    }
  }

  async function resetKidPin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedResetAccount) return;

    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(`${apiBase}/${selectedResetAccount.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: resetPin })
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.message ?? "Could not reset PIN.");
      }

      setResetPin("0000");
      setMessage(t("kids.resetPinDone", { name: selectedResetAccount.name }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reset PIN.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeKid(account: Account) {
    if (!window.confirm(t("kids.removeConfirm", { name: account.name }))) return;

    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(`${apiBase}/${account.id}`, { method: "DELETE" });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.message ?? "Could not remove kid.");
      }

      setMessage(t("kids.removed", { name: account.name }));
      await onChanged();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove kid.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="surface-card p-5">
      <div className="mb-5">
        <div className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-mint/15 text-mint">
          <UsersRound size={21} />
        </div>
        <h2 className="section-heading">{t("kids.title")}</h2>
        <p className="section-copy">{t("kids.description")}</p>
      </div>

      <form onSubmit={createKid} className="space-y-3 rounded-[8px] bg-ink/5 p-3">
        <p className="text-sm font-black text-ink/70">{t("kids.add")}</p>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("kids.namePlaceholder")}
          className="field-input h-11"
        />
        <input
          value={initialPin}
          onChange={(event) => setInitialPin(event.target.value.replace(/\D/g, "").slice(0, 8))}
          inputMode="numeric"
          placeholder={t("kids.initialPin")}
          className="field-input h-11"
        />
        <button
          disabled={isSaving}
          className="action-button action-mint w-full"
        >
          <Plus size={17} />
          {t("kids.add")}
        </button>
      </form>

      <form onSubmit={resetKidPin} className="mt-4 space-y-3 rounded-[8px] bg-ink/5 p-3">
        <p className="text-sm font-black text-ink/70">{t("kids.resetPin")}</p>
        <select
          value={selectedResetAccount?.id ?? ""}
          onChange={(event) => setResetAccountId(event.target.value)}
          className="field-input h-11"
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        <input
          value={resetPin}
          onChange={(event) => setResetPin(event.target.value.replace(/\D/g, "").slice(0, 8))}
          inputMode="numeric"
          placeholder={t("kids.newPin")}
          className="field-input h-11"
        />
        <button
          disabled={isSaving || !selectedResetAccount}
          className="action-button action-primary w-full"
        >
          <KeyRound size={17} />
          {t("kids.resetPin")}
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {accounts.map((account) => (
          <div key={account.id} className="flex items-center gap-3 rounded-[8px] border border-ink/5 p-3">
            <img src={account.avatarUrl} alt={`${account.name} avatar`} className="h-10 w-10 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-black text-ink">{account.name}</p>
              <p className="text-xs font-bold text-ink/45">{t("kids.balance", { amount: account.currentBalance })}</p>
            </div>
            <button
              type="button"
              onClick={() => removeKid(account)}
              disabled={isSaving || accounts.length <= 1}
              className="icon-button bg-coral/10 text-coral hover:bg-coral hover:text-white"
              aria-label={t("kids.removeAria", { name: account.name })}
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </div>

      {message && <p className="mt-4 rounded-[8px] bg-ink/5 px-3 py-2 text-sm font-bold text-ink/65">{message}</p>}
    </section>
  );
}
