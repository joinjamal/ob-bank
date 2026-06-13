"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { BadgeDollarSign, Gamepad2 } from "lucide-react";
import { updateAccountAvatar } from "@/app/actions";
import ActivityFeed from "@/components/ActivityFeed";
import BalanceCard from "@/components/BalanceCard";
import TrendChart from "@/components/TrendChart";
import KidTransactionModal from "@/components/KidTransactionModal";
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
  const animationTimer = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const [activeKidModal, setActiveKidModal] = useState<{ accountId: string; type: "Deposit" | "Withdrawal" } | null>(null);

  const sortedAccounts = useMemo(
    () =>
      [...accounts].sort((a, b) =>
        a.name === "Basil" ? -1 : b.name === "Basil" ? 1 : a.name.localeCompare(b.name)
      ),
    [accounts]
  );

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
      if (animationTimer.current) window.clearTimeout(animationTimer.current);
    };
  }, [loadData]);

  async function handleAvatarUpload(accountId: string, avatarUrl: string) {
    await updateAccountAvatar(accountId, avatarUrl);
    await loadData();
  }

  function handleQuickAdd(accountId: string, type: "Deposit" | "Withdrawal") {
    setActiveKidModal({ accountId, type });
  }

  async function saveKidTransaction(payload: { accountId: string; type: "Deposit" | "Withdrawal"; amount: number; reason: string }) {
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

    if (animationTimer.current) window.clearTimeout(animationTimer.current);
    setMoneyAnimation({ accountId: payload.accountId, type: payload.type, id: Date.now() });
    animationTimer.current = window.setTimeout(() => setMoneyAnimation(null), 1100) as any;
  }

  const activeAccount = activeKidModal ? sortedAccounts.find(a => a.id === activeKidModal.accountId) : null;

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 border-b-4 border-arcade-dark pb-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded bg-arcade-dark px-3 py-1 font-arcade text-xs text-arcade-green shadow-retro">
            <Gamepad2 size={14} />
            INSERT COIN TO PLAY
          </div>
          <h1 className="font-arcade text-4xl text-arcade-dark sm:text-6xl uppercase" style={{ textShadow: "4px 4px 0px #39ff14" }}>OB Bank Arcade</h1>
          <p className="mt-4 max-w-2xl font-rounded text-lg font-bold text-arcade-dark/70">
            Player 1 and Player 2, check your scores and claim your coins!
          </p>
        </header>

        {error && <p className="mb-5 rounded border-2 border-arcade-pink bg-arcade-pink/10 p-4 font-arcade text-xs uppercase text-arcade-pink">{error}</p>}

        {isLoading ? (
          <div className="grid min-h-[50vh] place-items-center rounded-xl border-4 border-arcade-dark bg-white p-8 font-arcade text-xl text-arcade-dark shadow-retro">
            LOADING GAME...
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {sortedAccounts.map((account) => (
                <BalanceCard 
                  key={account.id} 
                  account={account} 
                  animation={moneyAnimation?.accountId === account.id ? moneyAnimation : null}
                  showQuickActions={true}
                  onAvatarUpload={handleAvatarUpload} 
                  onQuickAdd={handleQuickAdd}
                />
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              <div className="rounded-xl border-4 border-arcade-dark bg-white p-2 shadow-retro">
                <TrendChart data={ledger} />
              </div>
              <div className="rounded-xl border-4 border-arcade-dark bg-white p-2 shadow-retro">
                <ActivityFeed transactions={transactions} compact />
              </div>
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
