"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { Home, Lock, Shield, Sparkles } from "lucide-react";
import { registerParentFamily, signInParent } from "@/app/actions";
import AuthLoadingOverlay from "@/components/AuthLoadingOverlay";
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
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginState, loginAction] = useFormState(signInParent, { ok: true, message: "" });
  const [registerState, registerAction] = useFormState(registerParentFamily, { ok: true, message: "" });

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <section className="w-full max-w-md rounded-[8px] bg-white p-6 shadow-lift">
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
          <h1 className="text-3xl font-black">Family portal</h1>
          <p className="mt-2 font-bold text-ink/60">Sign in or create your family's allowance vault.</p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-[8px] bg-ink/5 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`h-10 rounded-[8px] font-black ${mode === "login" ? "bg-white text-ink shadow-sm" : "text-ink/55"}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`h-10 rounded-[8px] font-black ${mode === "register" ? "bg-white text-ink shadow-sm" : "text-ink/55"}`}
          >
            New family
          </button>
        </div>

        {mode === "login" ? (
          <form action={loginAction}>
            <AuthLoadingOverlay
              title="Opening parent portal"
              message="Checking your parent access and loading the family controls."
            />
            <input type="hidden" name="redirectTo" value="/parent" />
            <label className="block">
          <span className="mb-2 block text-sm font-black text-ink/70">Parent name or email</span>
          <input
            name="email"
            autoComplete="username"
            placeholder="parent@email.com"
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
            <label className="mt-4 flex items-center gap-3 rounded-[8px] bg-ink/5 p-3 text-sm font-black text-ink/70">
              <input name="remember" type="checkbox" className="h-5 w-5 accent-mint" defaultChecked />
              Keep me signed in on this device
            </label>
            {!loginState.ok && <p className="mt-4 rounded-[8px] bg-coral/10 px-3 py-2 text-sm font-bold text-coral">{loginState.message}</p>}
            <SubmitButton />
            <Link href="/reset-password" className="mt-4 inline-flex font-black text-mint">
              Forgot password?
            </Link>
          </form>
        ) : (
          <form action={registerAction}>
            <AuthLoadingOverlay
              title="Creating family vault"
              message="Setting up the family space and parent access."
            />
            <label className="block">
              <span className="mb-2 block text-sm font-black text-ink/70">Family name</span>
              <input name="familyName" placeholder="Your family name" className="h-12 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint" />
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-black text-ink/70">Parent name</span>
              <input name="parentName" placeholder="Parent name" className="h-12 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint" />
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-black text-ink/70">Email optional</span>
              <input name="email" type="email" autoComplete="username" placeholder="parent@email.com" className="h-12 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint" />
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-black text-ink/70">Password</span>
              <input name="password" type="password" autoComplete="new-password" className="h-12 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint" />
            </label>
            <label className="mt-4 flex items-center gap-3 rounded-[8px] bg-ink/5 p-3 text-sm font-black text-ink/70">
              <input name="remember" type="checkbox" className="h-5 w-5 accent-mint" defaultChecked />
              Keep me signed in on this device
            </label>
            {!registerState.ok && <p className="mt-4 rounded-[8px] bg-coral/10 px-3 py-2 text-sm font-bold text-coral">{registerState.message}</p>}
            <button className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-mint px-4 font-black text-white shadow-sm transition hover:-translate-y-0.5">
              <Sparkles size={18} />
              Create family vault
            </button>
          </form>
        )}
        <div className="mt-5 flex flex-wrap gap-3 text-sm font-black text-ink/45">
          <Link href="/terms" className="hover:text-mint">Terms</Link>
          <Link href="/privacy" className="hover:text-mint">Privacy</Link>
        </div>
      </section>
    </main>
  );
}
