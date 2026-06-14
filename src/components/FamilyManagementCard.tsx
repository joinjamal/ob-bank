"use client";

import { FormEvent, useEffect, useState } from "react";
import { KeyRound, Plus, Trash2, UsersRound } from "lucide-react";

export type FamilySummary = {
  id: string;
  name: string;
  parents: { id: string; familyId: string; name: string; email: string | null }[];
  accounts: { id: string; name: string }[];
};

export default function FamilyManagementCard({
  families,
  onChanged
}: {
  families: FamilySummary[];
  onChanged: () => Promise<void>;
}) {
  const [familyName, setFamilyName] = useState("");
  const [familyId, setFamilyId] = useState(families[0]?.id ?? "");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPassword, setParentPassword] = useState("password");
  const [resetPassword, setResetPassword] = useState("password");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!families.some((family) => family.id === familyId)) {
      setFamilyId(families[0]?.id ?? "");
    }
  }, [families, familyId]);

  async function createFamily(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submit("/api/families", { name: familyName }, `Created ${familyName}.`);
    setFamilyName("");
  }

  async function createParent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submit("/api/parents", { familyId, name: parentName, email: parentEmail, password: parentPassword }, `Created ${parentName}.`);
    setParentName("");
    setParentEmail("");
    setParentPassword("password");
  }

  async function submit(url: string, body: unknown, success: string) {
    setMessage("");
    setIsSaving(true);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "Could not save.");
      setMessage(success);
      await onChanged();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setIsSaving(false);
    }
  }

  async function resetParent(parentId: string, parentName: string) {
    setMessage("");
    setIsSaving(true);
    try {
      const response = await fetch(`/api/parents/${parentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPassword })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "Could not reset password.");
      setMessage(`Reset ${parentName}'s password.`);
      setResetPassword("password");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reset password.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeParent(parentId: string, parentName: string) {
    if (!window.confirm(`Remove parent ${parentName}?`)) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/parents/${parentId}`, { method: "DELETE" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "Could not remove parent.");
      await onChanged();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove parent.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeFamily(targetFamilyId: string, targetFamilyName: string) {
    if (!window.confirm(`Remove ${targetFamilyName} and all parents, kids, and transactions inside it?`)) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/families/${targetFamilyId}`, { method: "DELETE" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "Could not remove family.");
      await onChanged();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove family.");
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
        <h2 className="text-xl font-black">Families and parents</h2>
        <p className="text-sm font-bold text-ink/55">Super admin controls every family and parent login.</p>
      </div>

      <form onSubmit={createFamily} className="space-y-3 rounded-[8px] bg-ink/5 p-3">
        <p className="text-sm font-black text-ink/70">Add family</p>
        <input value={familyName} onChange={(event) => setFamilyName(event.target.value)} placeholder="Family name" className="h-11 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint" />
        <button disabled={isSaving} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-mint font-black text-white transition hover:-translate-y-0.5 disabled:opacity-60">
          <Plus size={17} />
          Add family
        </button>
      </form>

      <form onSubmit={createParent} className="mt-4 space-y-3 rounded-[8px] bg-ink/5 p-3">
        <p className="text-sm font-black text-ink/70">Add parent</p>
        <select value={familyId} onChange={(event) => setFamilyId(event.target.value)} className="h-11 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint">
          {families.map((family) => (
            <option key={family.id} value={family.id}>{family.name}</option>
          ))}
        </select>
        <input value={parentName} onChange={(event) => setParentName(event.target.value)} placeholder="Parent name" className="h-11 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint" />
        <input value={parentEmail} onChange={(event) => setParentEmail(event.target.value)} placeholder="Email optional" className="h-11 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint" />
        <input value={parentPassword} onChange={(event) => setParentPassword(event.target.value)} placeholder="Password" className="h-11 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint" />
        <button disabled={isSaving || families.length === 0} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-ink font-black text-white transition hover:-translate-y-0.5 disabled:opacity-60">
          <Plus size={17} />
          Add parent
        </button>
      </form>

      <div className="mt-4 space-y-3">
        {families.map((family) => (
          <div key={family.id} className="rounded-[8px] border border-ink/5 p-3">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-black text-ink">{family.name}</p>
                <p className="text-xs font-bold text-ink/45">{family.accounts.length} kids</p>
              </div>
              <button type="button" onClick={() => removeFamily(family.id, family.name)} disabled={isSaving} className="grid h-9 w-9 place-items-center rounded-[8px] bg-coral/10 text-coral">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {family.parents.map((parent) => (
                <div key={parent.id} className="flex items-center gap-2 rounded-[8px] bg-ink/5 p-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black">{parent.name}</p>
                    <p className="truncate text-xs font-bold text-ink/45">{parent.email || "No email"}</p>
                  </div>
                  <button type="button" onClick={() => resetParent(parent.id, parent.name)} disabled={isSaving} className="grid h-9 w-9 place-items-center rounded-[8px] bg-mint/15 text-mint">
                    <KeyRound size={16} />
                  </button>
                  <button type="button" onClick={() => removeParent(parent.id, parent.name)} disabled={isSaving} className="grid h-9 w-9 place-items-center rounded-[8px] bg-coral/10 text-coral">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <label className="mt-4 block">
        <span className="mb-2 block text-sm font-black text-ink/70">Password reset value</span>
        <input value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} className="h-11 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint" />
      </label>

      {message && <p className="mt-4 rounded-[8px] bg-ink/5 px-3 py-2 text-sm font-bold text-ink/65">{message}</p>}
    </section>
  );
}
