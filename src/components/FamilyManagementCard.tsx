"use client";

import { useState } from "react";
import { KeyRound, Plus, Trash2, UsersRound } from "lucide-react";

export type FamilySummary = {
  id: string;
  name: string;
  createdAt: string;
  parents: { id: string; familyId: string; name: string; email: string | null }[];
  accounts: { id: string; name: string; currentBalance: number }[];
};

export default function FamilyManagementCard({
  families,
  onChanged
}: {
  families: FamilySummary[];
  onChanged: () => Promise<void>;
}) {
  const [resetPassword, setResetPassword] = useState("password");
  const [activeFamilyId, setActiveFamilyId] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPassword, setParentPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function addParent(familyId: string, familyName: string) {
    setMessage("");
    setIsSaving(true);
    try {
      const response = await fetch("/api/parents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId, name: parentName, email: parentEmail, password: parentPassword })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "Could not add parent.");
      setParentName("");
      setParentEmail("");
      setParentPassword("");
      setActiveFamilyId("");
      setMessage(`Added parent to ${familyName}.`);
      await onChanged();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add parent.");
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
    <section className="surface-card p-5">
      <div className="mb-5">
        <div className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-mint/15 text-mint">
          <UsersRound size={21} />
        </div>
        <h2 className="section-heading">Families</h2>
        <p className="section-copy">Review tenants, reset parent access, and remove abandoned families.</p>
      </div>

      <div className="space-y-3">
        {families.map((family) => (
          <div key={family.id} className="rounded-[8px] border border-ink/5 p-3">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-black text-ink">{family.name}</p>
                <p className="text-xs font-bold text-ink/45">
                  {family.parents.length} parents, {family.accounts.length} kids
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeFamily(family.id, family.name)}
                disabled={isSaving}
                className="icon-button bg-coral/10 text-coral hover:bg-coral hover:text-white"
                aria-label={`Remove ${family.name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {family.accounts.length === 0 ? (
                <span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-black text-ink/45">No kids yet</span>
              ) : (
                family.accounts.map((account) => (
                  <span key={account.id} className="rounded-full bg-mint/10 px-3 py-1 text-xs font-black text-mint">
                    {account.name}
                  </span>
                ))
              )}
            </div>

            <div className="mt-3 space-y-2">
              {family.parents.map((parent) => (
                <div key={parent.id} className="flex items-center gap-2 rounded-[8px] bg-ink/5 p-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black">{parent.name}</p>
                    <p className="truncate text-xs font-bold text-ink/45">{parent.email || "No email"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => resetParent(parent.id, parent.name)}
                    disabled={isSaving}
                    className="icon-button bg-mint/15 text-mint hover:bg-mint hover:text-white"
                    aria-label={`Reset ${parent.name}'s password`}
                  >
                    <KeyRound size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeParent(parent.id, parent.name)}
                    disabled={isSaving}
                    className="icon-button bg-coral/10 text-coral hover:bg-coral hover:text-white"
                    aria-label={`Remove ${parent.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {activeFamilyId === family.id ? (
              <div className="mt-3 rounded-[8px] bg-ink/5 p-3">
                <p className="mb-3 text-sm font-black text-ink">Add parent to {family.name}</p>
                <div className="grid gap-2">
                  <input
                    value={parentName}
                    onChange={(event) => setParentName(event.target.value)}
                    placeholder="Parent name"
                    className="field-input h-10 text-sm"
                  />
                  <input
                    value={parentEmail}
                    onChange={(event) => setParentEmail(event.target.value)}
                    type="email"
                    placeholder="Email optional"
                    className="field-input h-10 text-sm"
                  />
                  <input
                    value={parentPassword}
                    onChange={(event) => setParentPassword(event.target.value)}
                    type="password"
                    placeholder="Password"
                    className="field-input h-10 text-sm"
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => addParent(family.id, family.name)}
                    disabled={isSaving}
                    className="action-button action-mint min-h-10 px-3 py-1"
                  >
                    <Plus size={16} />
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFamilyId("")}
                    className="action-button action-quiet min-h-10 px-3 py-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setActiveFamilyId(family.id);
                  setParentName("");
                  setParentEmail("");
                  setParentPassword("");
                }}
                className="action-button action-primary mt-3 min-h-10 w-full px-3 py-1"
              >
                <Plus size={16} />
                Add parent
              </button>
            )}
          </div>
        ))}
      </div>

      <label className="mt-4 block">
        <span className="field-label">Parent password reset value</span>
        <input
          value={resetPassword}
          onChange={(event) => setResetPassword(event.target.value)}
          className="field-input h-11"
        />
      </label>

      {message && <p className="mt-4 rounded-[8px] bg-ink/5 px-3 py-2 text-sm font-bold text-ink/65">{message}</p>}
    </section>
  );
}
