"use client";

import { FormEvent, useState } from "react";
import { KeyRound, Plus, Trash2, UsersRound } from "lucide-react";

export type FamilyParent = {
  id: string;
  familyId: string;
  name: string;
  email: string | null;
};

export default function FamilyParentsCard({
  parents,
  onChanged
}: {
  parents: FamilyParent[];
  onChanged: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function addParent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSaving(true);
    try {
      const response = await fetch("/api/parent/parents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "Could not add parent.");
      setName("");
      setEmail("");
      setPassword("");
      setMessage("Parent login added.");
      await onChanged();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add parent.");
    } finally {
      setIsSaving(false);
    }
  }

  async function resetParent(parent: FamilyParent) {
    if (resetPassword.length < 6) {
      setMessage("Enter a reset password of at least 6 characters.");
      return;
    }

    setMessage("");
    setIsSaving(true);
    try {
      const response = await fetch(`/api/parent/parents/${parent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPassword })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "Could not reset password.");
      setResetPassword("");
      setMessage(`Reset ${parent.name}'s password.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reset password.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeParent(parent: FamilyParent) {
    if (!window.confirm(`Remove ${parent.name} from this family?`)) return;

    setMessage("");
    setIsSaving(true);
    try {
      const response = await fetch(`/api/parent/parents/${parent.id}`, { method: "DELETE" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "Could not remove parent.");
      setMessage(`Removed ${parent.name}.`);
      await onChanged();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove parent.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-[8px] bg-white p-5 shadow-lift">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mint/15 text-mint">
          <UsersRound size={21} />
        </div>
        <div>
          <h2 className="text-xl font-black">Family parents</h2>
          <p className="text-sm font-bold text-ink/55">Add another parent login or reset access for this family.</p>
        </div>
      </div>

      <div className="space-y-2">
        {parents.map((parent) => (
          <div key={parent.id} className="grid gap-2 rounded-[8px] bg-ink/5 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="min-w-0">
              <p className="truncate font-black text-ink">{parent.name}</p>
              <p className="truncate text-xs font-bold text-ink/45">{parent.email || "No email"}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => resetParent(parent)}
                disabled={isSaving || resetPassword.length < 6}
                className="grid h-10 w-10 place-items-center rounded-[8px] bg-mint/15 text-mint disabled:opacity-40"
                aria-label={`Reset ${parent.name}'s password`}
              >
                <KeyRound size={17} />
              </button>
              <button
                type="button"
                onClick={() => removeParent(parent)}
                disabled={isSaving || parents.length <= 1}
                className="grid h-10 w-10 place-items-center rounded-[8px] bg-coral/10 text-coral disabled:opacity-40"
                aria-label={`Remove ${parent.name}`}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <label className="mt-4 block">
        <span className="mb-2 block text-sm font-black text-ink/70">Password for reset buttons</span>
        <input
          value={resetPassword}
          onChange={(event) => setResetPassword(event.target.value)}
          type="password"
          placeholder="New password"
          className="h-11 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint"
        />
      </label>

      <form onSubmit={addParent} className="mt-5 rounded-[8px] bg-ink/5 p-3">
        <p className="mb-3 font-black text-ink">Add parent</p>
        <div className="grid gap-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Parent name"
            className="h-11 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint"
          />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder="Email optional"
            className="h-11 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="Password"
            className="h-11 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint"
          />
        </div>
        <button
          disabled={isSaving}
          className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-ink px-3 font-black text-white disabled:opacity-60"
        >
          <Plus size={17} />
          Add parent login
        </button>
      </form>

      {message && <p className="mt-4 rounded-[8px] bg-ink/5 px-3 py-2 text-sm font-bold text-ink/65">{message}</p>}
    </section>
  );
}
