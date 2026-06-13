"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BadgeDollarSign, Shield } from "lucide-react";
import Link from "next/link";
import { updateAccountAvatar } from "@/app/actions";
import ActivityFeed from "@/components/ActivityFeed";
import BalanceCard from "@/components/BalanceCard";
import KidTransactionModal from "@/components/KidTransactionModal";
import TrendChart from "@/components/TrendChart";
import { Account, LedgerPoint, Transaction } from "@/components/types";
import { playTransactionSound } from "@/lib/sounds";

type MoneyAnimation = {
  accountId: string;
  type: "Deposit" | "Withdrawal";
  id: number;
} | null;

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ledger, setLedger] = useState<LedgerPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [moneyAnimation, setMoneyAnimation] = useState<MoneyAnimation>(null);
  const [activeKidModal, setActiveKidModal] = useState<{
    accountId: string;
    type: "Deposit" | "Withdrawal";
  } | null>(null);
  const animationTimer = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const sortedAccounts = useMemo(
    () =>
      [...accounts].sort((a, b) =>
        a.name === "Basil" ? -1 : b.name === "Basil" ? 1 : a.name.localeCompare(b.name)
      ),
    [accounts]
  );

  const activeAccount = activeKidModal ? sortedAccounts.find((account) => account.id === activeKidModal.accountId) : null;

  const loadData = useCallback(async () => {
    setError("");
    const [accountResponse, transactionResponse, ledgerResponse] = await Promise.all([
      fetch("/api/accounts", { cache: "no-store" }),
      fetch("/api/transactions", { cache: "no-store" }),
      fetch("/api/ledger", { cache: "no-store" })
    ]);

    if (!accountResponse.ok || !transactionResponse.ok || !ledgerResponse.ok) {
      throw new Error("Could not load OB Bank data.");
    }

    setAccounts(await accountResponse.json());
    setTransactions(await transactionResponse.json());
    setLedger(await ledgerResponse.json());
  }, []);

  useEffect(() => {
    loadData()
      .catch((err) => setError(err instanceof Error ? err.message : "Something went wrong."))
      .finally(() => setIsLoading(false));

    return () => {
      if (animationTimer.current) {
        window.clearTimeout(animationTimer.current);
      }
    };
  }, [loadData]);

  async function handleAvatarUpload(accountId: string, avatarUrl: string) {
    await updateAccountAvatar(accountId, avatarUrl);
    await loadData();
  }

  async function saveKidTransaction(payload: {
    accountId: string;
    type: "Deposit" | "Withdrawal";
    amount: number;
    reason: string;
  }) {
    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message ?? "Could not save the transaction.");
    }

    await loadData();
    playTransactionSound(payload.type);

    if (animationTimer.current) {
      window.clearTimeout(animationTimer.current);
    }

    setMoneyAnimation({ accountId: payload.accountId, type: payload.type, id: Date.now() });
    animationTimer.current = window.setTimeout(() => setMoneyAnimation(null), 1100);
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-sm font-black shadow-sm">
              <BadgeDollarSign size={17} className="text-mint" />
              Save, spend, and grow
            </div>
            <h1 className="text-4xl font-black tracking-normal text-ink sm:text-6xl">OB Bank</h1>
            <p className="mt-2 max-w-2xl text-base font-bold text-ink/65 sm:text-lg">
              Build your balance, choose a goal, and watch your progress climb.
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

        {error && <p className="mb-5 rounded-[8px] bg-coral/10 p-4 font-bold text-coral">{error}</p>}

        {isLoading ? (
          <div className="grid min-h-[50vh] place-items-center rounded-[8px] bg-white/80 p-8 text-xl font-black shadow-lift">
            Loading OB Bank...
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              {sortedAccounts.map((account) => (
                <BalanceCard
                  key={account.id}
                  account={account}
                  animation={moneyAnimation?.accountId === account.id ? moneyAnimation : null}
                  showQuickActions
                  onAvatarUpload={handleAvatarUpload}
                  onQuickAdd={(accountId, type) => setActiveKidModal({ accountId, type })}
                />
              ))}
            </div>
            <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
              <TrendChart data={ledger} />
              <ActivityFeed transactions={transactions} compact />
            </div>
          </div>
        )}
      </div>

      {activeAccount && activeKidModal && (
        <KidTransactionModal
          account={activeAccount}
          type={activeKidModal.type}
          onClose={() => setActiveKidModal(null)}
          onSave={saveKidTransaction}
        />
      )}
    </main>
  );
}
