"use client";

import { useMemo, useRef, useState } from "react";
import { BadgeDollarSign, KeyRound, LogOut, Shield } from "lucide-react";
import Link from "next/link";
import { updateAccountAvatar } from "@/app/actions";
import ActivityFeed from "@/components/ActivityFeed";
import BalanceCard from "@/components/BalanceCard";
import KidPinSettings from "@/components/KidPinSettings";
import KidProgressPanel from "@/components/KidProgressPanel";
import KidTransactionModal from "@/components/KidTransactionModal";
import KidWealthTrail from "@/components/KidWealthTrail";
import StandardCalculator from "@/components/StandardCalculator";
import type { Account, KidLoginAccount, Transaction } from "@/components/types";
import {
  applyAccountDelta,
  createOptimisticTransaction,
  signedAmount
} from "@/lib/optimisticMoney";
import { playTransactionSound } from "@/lib/sounds";

type KidLedgerPoint = {
  id: string;
  date: string;
  balance: number;
};

type KidData = {
  account: Account;
  transactions: Transaction[];
  ledger: KidLedgerPoint[];
};

type MoneyAnimation = {
  accountId: string;
  type: "Deposit" | "Withdrawal";
  id: number;
} | null;

export default function KidPortal({ kids }: { kids: KidLoginAccount[] }) {
  const [selectedKidId, setSelectedKidId] = useState(kids[0]?.id ?? "");
  const [pin, setPin] = useState("");
  const [kidData, setKidData] = useState<KidData | null>(null);
  const [activeMove, setActiveMove] = useState<"Deposit" | "Withdrawal" | null>(null);
  const [moneyAnimation, setMoneyAnimation] = useState<MoneyAnimation>(null);
  const [message, setMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const animationTimer = useRef<number | null>(null);

  const selectedKid = useMemo(
    () => kids.find((kid) => kid.id === selectedKidId) ?? kids[0],
    [kids, selectedKidId]
  );

  async function handleLogin() {
    setMessage("");

    if (!selectedKid || !/^\d{4,8}$/.test(pin)) {
      setMessage("Choose your name and enter your PIN.");
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = await fetch("/api/kids/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: selectedKid.id, pin })
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.message ?? "Could not open your profile.");
      }

      setKidData(body);
      setPin("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not open your profile.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleAvatarUpload(accountId: string, avatarUrl: string) {
    await updateAccountAvatar(accountId, avatarUrl);
    setKidData((current) =>
      current && current.account.id === accountId
        ? { ...current, account: { ...current.account, avatarUrl } }
        : current
    );
  }

  function handleProfileStyleChange(accountId: string, profileColor: string, profilePattern: string) {
    setKidData((current) =>
      current && current.account.id === accountId
        ? { ...current, account: { ...current.account, profileColor, profilePattern } }
        : current
    );
  }

  function triggerMoneyAnimation(accountId: string, type: "Deposit" | "Withdrawal") {
    playTransactionSound(type);

    if (animationTimer.current) {
      window.clearTimeout(animationTimer.current);
    }

    setMoneyAnimation({ accountId, type, id: Date.now() });
    animationTimer.current = window.setTimeout(() => setMoneyAnimation(null), 1100);
  }

  async function saveKidTransaction(payload: {
    accountId: string;
    type: "Deposit" | "Withdrawal";
    amount: number;
    reason: string;
  }) {
    if (!kidData) return;

    const optimisticId = `kid-${Date.now()}`;
    const optimisticTransaction = createOptimisticTransaction(payload, kidData.account, optimisticId);
    const delta = signedAmount(payload.type, payload.amount);
    const previous = kidData;
    const nextAccount = applyAccountDelta([kidData.account], payload.accountId, delta)[0];

    setKidData({
      ...kidData,
      account: nextAccount,
      transactions: [optimisticTransaction, ...kidData.transactions].slice(0, 80),
      ledger: bumpKidLedger(kidData.ledger, delta, nextAccount.currentBalance)
    });
    triggerMoneyAnimation(payload.accountId, payload.type);

    fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.message ?? "Could not save the transaction.");
        if (body?.transaction) {
          setKidData((current) =>
            current
              ? {
                  ...current,
                  transactions: current.transactions.map((transaction) =>
                    transaction.id === optimisticId ? body.transaction : transaction
                  )
                }
              : current
          );
        }
      })
      .catch((error) => {
        setKidData(previous);
        setMessage(error instanceof Error ? error.message : "Could not save the transaction.");
      });
  }

  if (!kidData) {
    return (
      <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <header className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-sm font-black shadow-sm">
                <BadgeDollarSign size={17} className="text-mint" />
                Kid vault login
              </div>
              <h1 className="text-4xl font-black text-ink sm:text-6xl">OB Bank</h1>
              <p className="mt-2 max-w-2xl text-base font-bold text-ink/65 sm:text-lg">
                Choose your profile and enter your PIN.
              </p>
            </div>
            <Link
              href="/admin"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-white px-4 font-black text-ink shadow-sm transition hover:-translate-y-0.5"
            >
              <Shield size={17} className="text-mint" />
              Parent
            </Link>
          </header>

          <section className="rounded-[8px] bg-white p-5 shadow-lift">
            <div className="grid gap-4 sm:grid-cols-2">
              {kids.map((kid) => (
                <button
                  key={kid.id}
                  type="button"
                  onClick={() => setSelectedKidId(kid.id)}
                  className={`rounded-[8px] border-4 p-4 text-left transition hover:-translate-y-1 ${
                    selectedKidId === kid.id ? "border-mint shadow-lift" : "border-white"
                  }`}
                  style={{ backgroundColor: kid.profileColor }}
                >
                  <img
                    src={kid.avatarUrl}
                    alt={`${kid.name} avatar`}
                    className="mb-3 h-24 w-24 rounded-full border-4 border-white object-cover shadow-sm"
                  />
                  <p className="text-2xl font-black text-ink">{kid.name}</p>
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
              <label>
                <span className="mb-2 block text-sm font-black text-ink/70">PIN</span>
                <div className="relative">
                  <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                  <input
                    value={pin}
                    onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 8))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void handleLogin();
                    }}
                    inputMode="numeric"
                    type="password"
                    placeholder="0000"
                    className="h-12 w-full rounded-[8px] border-2 border-ink/10 pl-10 pr-3 text-lg font-black outline-none focus:border-mint"
                  />
                </div>
              </label>
              <button
                type="button"
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="self-end h-12 rounded-[8px] bg-ink px-6 font-black text-white transition hover:-translate-y-0.5 disabled:opacity-60"
              >
                {isLoggingIn ? "Opening..." : "Open vault"}
              </button>
            </div>
            {message && <p className="mt-4 rounded-[8px] bg-coral/10 p-3 font-bold text-coral">{message}</p>}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-sm font-black shadow-sm">
              <BadgeDollarSign size={17} className="text-mint" />
              {kidData.account.name}&apos;s vault
            </div>
            <h1 className="text-4xl font-black tracking-normal text-ink sm:text-6xl">My OB Bank</h1>
            <p className="mt-2 max-w-2xl text-base font-bold text-ink/65 sm:text-lg">
              Save, spend carefully, and beat your best score.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setKidData(null);
                setMessage("");
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-white px-4 font-black text-ink shadow-sm transition hover:-translate-y-0.5"
            >
              <LogOut size={17} />
              Switch kid
            </button>
            <Link
              href="/admin"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-white px-4 font-black text-ink shadow-sm transition hover:-translate-y-0.5"
            >
              <Shield size={17} className="text-mint" />
              Parent
            </Link>
          </div>
        </header>

        {message && <p className="mb-5 rounded-[8px] bg-coral/10 p-4 font-bold text-coral">{message}</p>}

        <div className="space-y-5">
          <BalanceCard
            account={kidData.account}
            animation={moneyAnimation?.accountId === kidData.account.id ? moneyAnimation : null}
            showQuickActions
            onAvatarUpload={handleAvatarUpload}
            onProfileStyleChange={handleProfileStyleChange}
            onQuickAdd={(_, type) => setActiveMove(type)}
          />
          <KidProgressPanel accounts={[kidData.account]} transactions={kidData.transactions} />
          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <KidWealthTrail account={kidData.account} data={kidData.ledger} />
            <ActivityFeed transactions={kidData.transactions} compact />
          </div>
          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <StandardCalculator />
            <KidPinSettings account={kidData.account} />
          </div>
        </div>
      </div>

      {activeMove && (
        <KidTransactionModal
          account={kidData.account}
          type={activeMove}
          onClose={() => setActiveMove(null)}
          onSave={saveKidTransaction}
        />
      )}
    </main>
  );
}

function bumpKidLedger(ledger: KidLedgerPoint[], delta: number, currentBalance: number) {
  const todayId = new Date().toISOString().slice(0, 10);
  const index = ledger.findIndex((point) => point.id === todayId);

  if (index >= 0) {
    return ledger.map((point, pointIndex) =>
      pointIndex === index ? { ...point, balance: Number((point.balance + delta).toFixed(2)) } : point
    );
  }

  return [
    ...ledger,
    {
      id: todayId,
      date: new Date().toISOString(),
      balance: currentBalance
    }
  ];
}
