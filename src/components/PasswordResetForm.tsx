"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { KeyRound, Send } from "lucide-react";
import { requestPasswordReset, resetParentPassword } from "@/app/actions";

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-mint px-4 font-black text-white shadow-sm transition hover:-translate-y-0.5 disabled:opacity-60"
    >
      <Send size={18} />
      {pending ? pendingLabel : label}
    </button>
  );
}

export default function PasswordResetForm({ token }: { token?: string }) {
  const [requestState, requestAction] = useFormState(requestPasswordReset, { ok: true, message: "", resetUrl: "" });
  const [resetState, resetAction] = useFormState(resetParentPassword, { ok: true, message: "" });

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <section className="w-full max-w-md rounded-[8px] bg-white p-6 shadow-lift">
        <div className="mb-5">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-mint/15 text-mint">
            <KeyRound size={24} />
          </div>
          <h1 className="text-3xl font-black">Reset parent password</h1>
          <p className="mt-2 font-bold text-ink/60">Create or use a secure reset link for the parent portal.</p>
        </div>

        {token ? (
          <form action={resetAction}>
            <input type="hidden" name="token" value={token} />
            <label className="block">
              <span className="mb-2 block text-sm font-black text-ink/70">New password</span>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                className="h-12 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint"
              />
            </label>
            {!resetState.ok && <p className="mt-4 rounded-[8px] bg-coral/10 px-3 py-2 text-sm font-bold text-coral">{resetState.message}</p>}
            {resetState.ok && resetState.message && <p className="mt-4 rounded-[8px] bg-mint/10 px-3 py-2 text-sm font-bold text-mint">{resetState.message}</p>}
            <Submit label="Update password" pendingLabel="Updating..." />
          </form>
        ) : (
          <form action={requestAction}>
            <label className="block">
              <span className="mb-2 block text-sm font-black text-ink/70">Parent name or email</span>
              <input
                name="email"
                autoComplete="username"
                placeholder="parent@email.com"
                className="h-12 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint"
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
