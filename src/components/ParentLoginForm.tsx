"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { Home, Lock, Shield } from "lucide-react";
import { signInParent } from "@/app/actions";
import ThemeToggle from "@/components/ThemeToggle";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-ink px-4 font-black text-white shadow-sm transition hover:-translate-y-0.5 disabled:opacity-60"
    >
      <Lock size={18} />
      {pending ? "Checking..." : "Enter parent portal"}
    </button>
  );
}

export default function ParentLoginForm() {
  const [state, formAction] = useFormState(signInParent, { ok: true, message: "" });

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <form action={formAction} className="w-full max-w-md rounded-[8px] bg-white p-6 shadow-lift">
        <div className="mb-5 grid grid-cols-3 gap-2">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-ink/5 px-3 text-sm font-black text-ink shadow-sm transition hover:-translate-y-0.5"
          >
            <Home size={16} className="text-mint" />
            Home
          </Link>
          <Link
            href="/admin"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-ink px-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5"
          >
            <Shield size={16} className="text-mint" />
            Admin
          </Link>
          <ThemeToggle compact />
        </div>
        <div className="mb-5">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-mint/15 text-mint">
            <Lock size={24} />
          </div>
          <h1 className="text-3xl font-black">Jamal family portal</h1>
          <p className="mt-2 font-bold text-ink/60">Jamal can sign in here to manage only Basil and Osama.</p>
        </div>
        <label className="block">
          <span className="mb-2 block text-sm font-black text-ink/70">Parent name or email</span>
          <input
            name="email"
            autoComplete="username"
            placeholder="Jamal"
            className="h-12 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint"
          />
        </label>
        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-black text-ink/70">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            className="h-12 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint"
          />
        </label>
        {!state.ok && <p className="mt-4 rounded-[8px] bg-coral/10 px-3 py-2 text-sm font-bold text-coral">{state.message}</p>}
        <SubmitButton />
      </form>
    </main>
  );
}
