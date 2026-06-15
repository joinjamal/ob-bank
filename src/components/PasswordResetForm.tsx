"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, Send } from "lucide-react";
import { requestPasswordReset, resetParentPassword } from "@/app/actions";

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="action-button action-mint mt-5 w-full"
    >
      <Send size={18} />
      {pending ? pendingLabel : label}
    </button>
  );
}

export default function PasswordResetForm({ token }: { token?: string }) {
  const [requestState, requestAction] = useActionState(requestPasswordReset, { ok: true, message: "", resetUrl: "" });
  const [resetState, resetAction] = useActionState(resetParentPassword, { ok: true, message: "" });

  return (
    <main className="app-shell grid place-items-center">
      <section className="surface-card w-full max-w-md p-5 sm:p-6">
        <div className="mb-5">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-mint/15 text-mint">
            <KeyRound size={24} />
          </div>
          <h1 className="text-3xl font-black">Reset parent password</h1>
          <p className="section-copy mt-2">Create or use a secure reset link for the parent portal.</p>
        </div>

        {token ? (
          <form action={resetAction}>
            <input type="hidden" name="token" value={token} />
            <label className="block">
              <span className="field-label">New password</span>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                className="field-input"
              />
            </label>
            {!resetState.ok && <p className="mt-4 rounded-[8px] bg-coral/10 px-3 py-2 text-sm font-bold text-coral">{resetState.message}</p>}
            {resetState.ok && resetState.message && <p className="mt-4 rounded-[8px] bg-mint/10 px-3 py-2 text-sm font-bold text-mint">{resetState.message}</p>}
            <Submit label="Update password" pendingLabel="Updating..." />
          </form>
        ) : (
          <form action={requestAction}>
            <label className="block">
              <span className="field-label">Parent name or email</span>
              <input
                name="email"
                autoComplete="username"
                placeholder="parent@email.com"
                className="field-input"
              />
            </label>
            {requestState.message && <p className="mt-4 rounded-[8px] bg-mint/10 px-3 py-2 text-sm font-bold text-mint">{requestState.message}</p>}
            {requestState.resetUrl && (
              <Link href={requestState.resetUrl} className="mt-3 block break-all rounded-[8px] bg-ink/5 p-3 text-sm font-bold text-ink/65">
                {requestState.resetUrl}
              </Link>
            )}
            <Submit label="Create reset link" pendingLabel="Creating..." />
          </form>
        )}

        <Link href="/parent" className="mt-4 inline-flex font-black text-mint">
          Back to parent sign in
        </Link>
      </section>
    </main>
  );
}
