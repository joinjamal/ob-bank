"use client";

import { FormEvent, useState } from "react";
import { KeyRound, Plus, Trash2, UsersRound } from "lucide-react";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
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
      setMessage(t("familyParents.added"));
      await onChanged();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add parent.");
    } finally {
      setIsSaving(false);
    }
  }

  async function resetParent(parent: FamilyParent) {
    if (resetPassword.length < 6) {
      setMessage(t("familyParents.resetTooShort"));
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
      setMessage(t("familyParents.resetDone", { name: parent.name }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reset password.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeParent(parent: FamilyParent) {
    if (!window.confirm(t("familyParents.removeConfirm", { name: parent.name }))) return;

    setMessage("");
    setIsSaving(true);
    try {
      const response = await fetch(`/api/parent/parents/${parent.id}`, { method: "DELETE" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "Could not remove parent.");
      setMessage(t("familyParents.removed", { name: parent.name }));
      await onChanged();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove parent.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="surface-card p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mint/15 text-mint">
          <UsersRound size={21} />
        </div>
        <div>
          <h2 className="section-heading">{t("familyParents.title")}</h2>
          <p className="section-copy">{t("familyParents.description")}</p>
        </div>
      </div>

      <div className="space-y-2">
        {parents.map((parent) => (
          <div key={parent.id} className="grid gap-2 rounded-[8px] bg-ink/5 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="min-w-0">
              <p className="truncate font-black text-ink">{parent.name}</p>
              <p className="truncate text-xs font-bold text-ink/45">{parent.email || t("familyParents.noEmail")}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => resetParent(parent)}
                disabled={isSaving || resetPassword.length < 6}
                className="icon-button bg-mint/15 text-mint hover:bg-mint hover:text-white"
                aria-label={t("familyParents.reset", { name: parent.name })}
              >
                <KeyRound size={17} />
              </button>
              <button
                type="button"
                onClick={() => removeParent(parent)}
                disabled={isSaving || parents.length <= 1}
                className="icon-button bg-coral/10 text-coral hover:bg-coral hover:text-white"
                aria-label={t("familyParents.remove", { name: parent.name })}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <label className="mt-4 block">
        <span className="field-label">{t("familyParents.passwordReset")}</span>
        <input
          value={resetPassword}
          onChange={(event) => setResetPassword(event.target.value)}
          type="password"
          placeholder={t("auth.password")}
          className="field-input h-11"
        />
      </label>

      <form onSubmit={addParent} className="mt-5 rounded-[8px] bg-ink/5 p-3">
        <p className="mb-3 font-black text-ink">{t("familyParents.add")}</p>
        <div className="grid gap-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("auth.parentNamePlaceholder")}
            className="field-input h-11"
          />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder={t("auth.emailOptional")}
            className="field-input h-11"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder={t("auth.password")}
            className="field-input h-11"
          />
        </div>
        <button
          disabled={isSaving}
          className="action-button action-primary mt-3 w-full"
        >
          <Plus size={17} />
          {t("familyParents.addLogin")}
        </button>
      </form>

      {message && <p className="mt-4 rounded-[8px] bg-ink/5 px-3 py-2 text-sm font-bold text-ink/65">{message}</p>}
    </section>
  );
}
