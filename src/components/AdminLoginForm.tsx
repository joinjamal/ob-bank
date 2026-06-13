"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Lock } from "lucide-react";
import { signInAdmin } from "@/app/actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-ink px-4 font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
    >
      <Lock size={18} />
      {pending ? "Checking..." : "Enter admin"}
    </button>
  );
}

export default function AdminLoginForm() {
  const [state, formAction] = useFormState(signInAdmin, { ok: true, message: "" });

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <form action={formAction} className="w-full max-w-md rounded-[8px] bg-white p-6 shadow-lift">
        <div className="mb-5">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-mint/15 text-mint">
            <Lock size={24} />
          </div>
          <h1 className="text-3xl font-black">Parent admin</h1>
          <p className="mt-2 font-bold text-ink/60">Enter the parent password to manage OB Bank.</p>
        </div>
        <label className="block">
          <span className="mb-2 block text-sm font-black text-ink/70">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            className="h-12 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none transition focus:border-mint"
          />
        </label>
        {!state.ok && (
          <p className="mt-4 rounded-[8px] bg-coral/10 px-3 py-2 text-sm font-bold text-coral">{state.message}</p>
        )}
        <SubmitButton />
      </form>
    </main>
  );
}
