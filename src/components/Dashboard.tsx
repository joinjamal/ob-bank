"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BadgeDollarSign, RefreshCw, Upload } from "lucide-react";
import ActivityFeed from "@/components/ActivityFeed";
import BalanceCard from "@/components/BalanceCard";
import TransactionForm from "@/components/TransactionForm";
import TrendChart from "@/components/TrendChart";
import { Account, LedgerPoint, Transaction } from "@/components/types";
import { playTransactionSound } from "@/lib/sounds";

type Preset = { accountId: string; type: "Deposit" | "Withdrawal" } | null;
type MoneyAnimation = {
  accountId: string;
  type: "Deposit" | "Withdrawal";
  id: number;
} | null;

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ledger, setLedger] = useState<LedgerPoint[]>([]);
  const [preset, setPreset] = useState<Preset>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [moneyAnimation, setMoneyAnimation] = useState<MoneyAnimation>(null);
  const [error, setError] = useState("");
  const animationTimer = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const sortedAccounts = useMemo(
    () => [...accounts].sort((a, b) => (a.name === "Basil" ? -1 : b.name === "Basil" ? 1 : a.name.localeCompare(b.name))),
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
  }, [loadData]);

  useEffect(() => {
    return () => {
      if (animationTimer.current) {
        window.clearTimeout(animationTimer.current);
      }
    };
  }, []);

  async function saveTransaction(payload: {
    accountId: string;
    type: "Deposit" | "Withdrawal";
    amount: number;
    reason?: string;
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

    setMoneyAnimation({
      accountId: payload.accountId,
      type: payload.type,
      id: Date.now()
    });

    animationTimer.current = window.setTimeout(() => setMoneyAnimation(null), 1100) as any;
  }

  function handleQuickAdd(accountId: string, type: "Deposit" | "Withdrawal") {
    setPreset({ accountId, type });
    document.getElementById("transaction-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-sm font-black shadow-sm">
              <BadgeDollarSign size={17} className="text-mint" />
              Digital allowance bank
            </div>
            <h1 className="text-4xl font-black tracking-normal text-ink sm:text-6xl">OB Bank</h1>
            <p className="mt-2 max-w-2xl text-base font-bold text-ink/65 sm:text-lg">
              A bright, quick ledger for Basil and Osama, built for logging money moves without opening a spreadsheet.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => loadData().catch((err) => setError(err.message))}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-white px-4 font-black shadow-sm transition hover:-translate-y-0.5"
            >
              <RefreshCw size={17} />
              Refresh
            </button>
            <a
              href="#import-notes"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-ink px-4 font-black text-white shadow-sm transition hover:-translate-y-0.5"
            >
              <Upload size={17} />
              Import
            </a>
          </div>
        </header>

        {error && <p className="mb-5 rounded-[8px] bg-coral/10 p-4 font-bold text-coral">{error}</p>}

        {isLoading ? (
          <div className="grid min-h-[50vh] place-items-center rounded-[8px] bg-white/80 p-8 text-xl font-black shadow-lift">
            Loading OB Bank...
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
            <div className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                {sortedAccounts.map((account) => (
                  <BalanceCard
                    key={account.id}
                    account={account}
                    animation={moneyAnimation?.accountId === account.id ? moneyAnimation : null}
                    onQuickAdd={handleQuickAdd}
                  />
                ))}
              </div>
              <TrendChart data={ledger} />
              <section id="import-notes" className="rounded-[8px] bg-white/85 p-5 shadow-lift">
                <h2 className="text-xl font-black">Legacy CSV import</h2>
                <p className="mt-2 font-bold text-ink/60">
                  Send a POST request to <code className="rounded bg-ink/5 px-2 py-1">/api/import</code> with CSV
                  headers <code className="rounded bg-ink/5 px-2 py-1">kid,date,type,amount,reason</code>. The reason
                  column is optional. Accepted transaction types include Deposit, Withdrawal, Add, and Remove.
                </p>
              </section>
            </div>
            <aside className="space-y-5">
              <div id="transaction-form">
                <TransactionForm accounts={sortedAccounts} preset={preset} onSubmit={saveTransaction} />
              </div>
              <ActivityFeed transactions={transactions} />
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
