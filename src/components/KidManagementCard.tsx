"use client";

import { FormEvent, useState } from "react";
import { KeyRound, Plus, Trash2, UsersRound } from "lucide-react";
import type { Account } from "@/components/types";

export default function KidManagementCard({
  accounts,
  onChanged
}: {
  accounts: Account[];
  onChanged: () => Promise<void>;
}) {
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
      const response = await fetch("/api/accounts", {
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
      setMessage(`Added ${body.name}.`);
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
      const response = await fetch(`/api/accounts/${selectedResetAccount.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: resetPin })
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.message ?? "Could not reset PIN.");
      }

      setResetPin("0000");
      setMessage(`Reset ${selectedResetAccount.name}'s PIN.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reset PIN.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeKid(account: Account) {
    if (!window.confirm(`Remove ${account.name} and all their transactions? This cannot be undone.`)) return;

    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/accounts/${account.id}`, { method: "DELETE" });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.message ?? "Could not remove kid.");
      }

      setMessage(`Removed ${account.name}.`);
      await onChanged();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove kid.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-[8px] bg-white p-5 shadow-lift">
      <div className="mb-5">
        <div className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-mint/15 text-mint">
          <UsersRound size={21} />
        </div>
        <h2 className="text-xl font-black">Kids</h2>
        <p className="text-sm font-bold text-ink/55">Add kids, remove kids, or reset a forgotten PIN.</p>
      </div>

      <form onSubmit={createKid} className="space-y-3 rounded-[8px] bg-ink/5 p-3">
        <p className="text-sm font-black text-ink/70">Add kid</p>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Kid name"
          className="h-11 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint"
        />
        <input
          value={initialPin}
          onChange={(event) => setInitialPin(event.target.value.replace(/\D/g, "").slice(0, 8))}
          inputMode="numeric"
          placeholder="Initial PIN"
          className="h-11 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint"
        />
        <button
          disabled={isSaving}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-mint font-black text-white transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          <Plus size={17} />
          Add kid
        </button>
      </form>

      <form onSubmit={resetKidPin} className="mt-4 space-y-3 rounded-[8px] bg-ink/5 p-3">
        <p className="text-sm font-black text-ink/70">Reset PIN</p>
        <select
          value={selectedResetAccount?.id ?? ""}
          onChange={(event) => setResetAccountId(event.target.value)}
          className="h-11 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint"
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
          placeholder="New PIN"
          className="h-11 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint"
        />
        <button
          disabled={isSaving || !selectedResetAccount}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-ink font-black text-white transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          <KeyRound size={17} />
          Reset PIN
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {accounts.map((account) => (
          <div key={account.id} className="flex items-center gap-3 rounded-[8px] border border-ink/5 p-3">
            <img src={account.avatarUrl} alt={`${account.name} avatar`} className="h-10 w-10 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-black text-ink">{account.name}</p>
              <p className="text-xs font-bold text-ink/45">Balance {account.currentBalance}</p>
            </div>
            <button
              type="button"
              onClick={() => removeKid(account)}
              disabled={isSaving || accounts.length <= 1}
              className="grid h-10 w-10 place-items-center rounded-[8px] bg-coral/10 text-coral transition hover:bg-coral hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={`Remove ${account.name}`}
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
