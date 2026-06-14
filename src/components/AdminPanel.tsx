"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, LogOut } from "lucide-react";
import { signOutAdmin } from "@/app/actions";
import AdminSummaryCards from "@/components/AdminSummaryCards";
import AdminTransactionList from "@/components/AdminTransactionList";
import BalanceCard from "@/components/BalanceCard";
import BalanceAdjustmentCard from "@/components/BalanceAdjustmentCard";
import CsvImportCard from "@/components/CsvImportCard";
import TransactionForm from "@/components/TransactionForm";
import { Account, LedgerPoint, Transaction } from "@/components/types";
import { playTransactionSound } from "@/lib/sounds";

type MoneyAnimation = {
  accountId: string;
  type: "Deposit" | "Withdrawal";
  id: number;
} | null;

type AdminData = {
  accounts: Account[];
  transactions: Transaction[];
  ledger: LedgerPoint[];
};

export default function AdminPanel({ initialData }: { initialData: AdminData }) {
  const [accounts, setAccounts] = useState<Account[]>(initialData.accounts);
  const [transactions, setTransactions] = useState<Transaction[]>(initialData.transactions);
  const [, setLedger] = useState<LedgerPoint[]>(initialData.ledger);
  const [moneyAnimation, setMoneyAnimation] = useState<MoneyAnimation>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const animationTimer = useRef<number | null>(null);

  const sortedAccounts = useMemo(
    () =>
      [...accounts].sort((a, b) =>
        a.name === "Basil" ? -1 : b.name === "Basil" ? 1 : a.name.localeCompare(b.name)
      ),
    [accounts]
  );

  const loadData = useCallback(async () => {
    setError("");
    setIsRefreshing(true);
    try {
      const [accountResponse, transactionResponse, ledgerResponse] = await Promise.all([
        fetch("/api/accounts", { cache: "no-store" }),
        fetch("/api/transactions", { cache: "no-store" }),
        fetch("/api/ledger", { cache: "no-store" })
      ]);

      if (!accountResponse.ok || !transactionResponse.ok || !ledgerResponse.ok) {
        throw new Error("Could not load admin data.");
      }

      setAccounts(await accountResponse.json());
      setTransactions(await transactionResponse.json());
      setLedger(await ledgerResponse.json());
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (animationTimer.current) {
        window.clearTimeout(animationTimer.current);
      }
    };
  }, [loadData]);

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

    setMoneyAnimation({ accountId: payload.accountId, type: payload.type, id: Date.now() });
    animationTimer.current = window.setTimeout(() => setMoneyAnimation(null), 1100);
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/" className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-sm font-black shadow-sm">
              <ArrowLeft size={17} className="text-mint" />
              Kid dashboard
            </Link>
            <h1 className="text-4xl font-black tracking-normal text-ink sm:text-5xl">Parent admin</h1>
            <p className="mt-2 max-w-2xl text-base font-bold text-ink/65">
              Add allowance moves, import old rows, and correct transaction history.
            </p>
          </div>
          <form action={signOutAdmin}>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-ink px-4 font-black text-white shadow-sm transition hover:-translate-y-0.5">
              <LogOut size={17} />
              Sign out
            </button>
          </form>
        </header>

        {error && <p className="mb-5 rounded-[8px] bg-coral/10 p-4 font-bold text-coral">{error}</p>}

        <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
          <div className="space-y-5">
            {isRefreshing && (
              <p className="rounded-[8px] bg-white/80 px-4 py-3 text-sm font-black text-ink/55 shadow-sm">
                Updating admin data...
              </p>
            )}
            <AdminSummaryCards accounts={sortedAccounts} transactions={transactions} />
            <div className="grid gap-5 md:grid-cols-2">
              {sortedAccounts.map((account) => (
                <BalanceCard
                  key={account.id}
                  account={account}
                  animation={moneyAnimation?.accountId === account.id ? moneyAnimation : null}
                />
              ))}
            </div>
            <AdminTransactionList transactions={transactions} onChanged={loadData} />
          </div>
          <aside className="space-y-5">
            <BalanceAdjustmentCard accounts={sortedAccounts} onAdjusted={loadData} />
            <TransactionForm accounts={sortedAccounts} onSubmit={saveTransaction} />
            <CsvImportCard onImported={loadData} />
          </aside>
        </div>
      </div>
    </main>
  );
}
