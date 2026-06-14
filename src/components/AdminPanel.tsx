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
import FamilyManagementCard, { FamilySummary } from "@/components/FamilyManagementCard";
import KidManagementCard from "@/components/KidManagementCard";
import ThemeToggle from "@/components/ThemeToggle";
import TransactionForm from "@/components/TransactionForm";
import { Account, LedgerPoint, Transaction } from "@/components/types";
import {
  applyAccountDelta,
  createOptimisticTransaction,
  replacementDelta,
  signedAmount,
  transactionDelta
} from "@/lib/optimisticMoney";
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
  families: FamilySummary[];
};

export default function AdminPanel({ initialData }: { initialData: AdminData }) {
  const [accounts, setAccounts] = useState<Account[]>(initialData.accounts);
  const [transactions, setTransactions] = useState<Transaction[]>(initialData.transactions);
  const [, setLedger] = useState<LedgerPoint[]>(initialData.ledger);
  const [families, setFamilies] = useState<FamilySummary[]>(initialData.families);
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
      const [accountResponse, transactionResponse, ledgerResponse, familyResponse] = await Promise.all([
        fetch("/api/accounts", { cache: "no-store" }),
        fetch("/api/transactions", { cache: "no-store" }),
        fetch("/api/ledger", { cache: "no-store" }),
        fetch("/api/families", { cache: "no-store" })
      ]);

      if (!accountResponse.ok || !transactionResponse.ok || !ledgerResponse.ok || !familyResponse.ok) {
        throw new Error("Could not load admin data.");
      }

      setAccounts(await accountResponse.json());
      setTransactions(await transactionResponse.json());
      setLedger(await ledgerResponse.json());
      setFamilies(await familyResponse.json());
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

  function triggerMoneyAnimation(accountId: string, type: "Deposit" | "Withdrawal") {
    playTransactionSound(type);

    if (animationTimer.current) {
      window.clearTimeout(animationTimer.current);
    }

    setMoneyAnimation({ accountId, type, id: Date.now() });
    animationTimer.current = window.setTimeout(() => setMoneyAnimation(null), 1100);
  }

  async function saveTransaction(payload: {
    accountId: string;
    type: "Deposit" | "Withdrawal";
    amount: number;
    reason?: string;
  }) {
    const account = accounts.find((item) => item.id === payload.accountId);
    if (!account) return;

    const optimisticId = `admin-${Date.now()}`;
    const optimisticTransaction = createOptimisticTransaction(payload, account, optimisticId);
    const delta = signedAmount(payload.type, payload.amount);
    const previousAccounts = accounts;
    const previousTransactions = transactions;

    setError("");
    setAccounts(applyAccountDelta(previousAccounts, payload.accountId, delta));
    setTransactions((current) => [optimisticTransaction, ...current]);
    triggerMoneyAnimation(payload.accountId, payload.type);

    fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(async (response) => {
        const body = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(body?.message ?? "Could not save the transaction.");
        }

        if (body?.transaction) {
          setTransactions((current) =>
            current.map((transaction) => (transaction.id === optimisticId ? body.transaction : transaction))
          );
        }
      })
      .catch((err) => {
        setAccounts(previousAccounts);
        setTransactions(previousTransactions);
        setError(err instanceof Error ? err.message : "Could not save the transaction.");
      });
  }

  async function editTransaction(transactionId: string, payload: { type: "Deposit" | "Withdrawal"; amount: number; reason: string }) {
    const previous = transactions.find((transaction) => transaction.id === transactionId);
    if (!previous) return;

    const nextTransaction: Transaction = {
      ...previous,
      type: payload.type,
      amount: payload.amount,
      reason: payload.reason.trim() || null
    };
    const delta = replacementDelta(previous, nextTransaction);
    const previousAccounts = accounts;
    const previousTransactions = transactions;

    setError("");
    setAccounts(applyAccountDelta(previousAccounts, previous.accountId, delta));
    setTransactions((current) =>
      current.map((transaction) => (transaction.id === transactionId ? nextTransaction : transaction))
    );

    fetch(`/api/transactions/${transactionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(async (response) => {
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setAccounts(previousAccounts);
        setTransactions(previousTransactions);
        throw new Error(body?.message ?? "Could not update transaction.");
      }
    }).catch((err) => {
      setError(err instanceof Error ? err.message : "Could not update transaction.");
    });
  }

  async function deleteTransactions(items: Transaction[]) {
    if (items.length === 0) return;

    const previousAccounts = accounts;
    const previousTransactions = transactions;
    const accountDeltas = items.reduce<Record<string, number>>((deltas, transaction) => {
      deltas[transaction.accountId] = (deltas[transaction.accountId] ?? 0) - transactionDelta(transaction);
      return deltas;
    }, {});

    setError("");
    setAccounts((current) =>
      Object.entries(accountDeltas).reduce(
        (nextAccounts, [accountId, delta]) => applyAccountDelta(nextAccounts, accountId, delta),
        current
      )
    );
    setTransactions((current) => current.filter((transaction) => !items.some((item) => item.id === transaction.id)));

    const endpoint =
      items.length === 1 ? `/api/transactions/${items[0].id}` : "/api/transactions/bulk-delete";
    const options =
      items.length === 1
        ? { method: "DELETE" }
        : {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: items.map((item) => item.id) })
          };

    fetch(endpoint, options)
      .then(async (response) => {
        const body = await response.json().catch(() => null);

        if (!response.ok) {
          setAccounts(previousAccounts);
          setTransactions(previousTransactions);
          throw new Error(body?.message ?? "Could not delete transaction.");
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not delete transaction.");
      });
  }

  return (
    <main className="super-admin-shell min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/" className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-sm font-black shadow-sm">
              <ArrowLeft size={17} className="text-mint" />
              Kid dashboard
            </Link>
            <h1 className="text-4xl font-black tracking-normal text-ink sm:text-5xl">Super admin</h1>
            <p className="mt-2 max-w-2xl text-base font-bold text-ink/65">
              Control families, parent logins, kids, imports, and full transaction history.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ThemeToggle compact />
            <form action={signOutAdmin}>
              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-ink px-4 font-black text-white shadow-sm transition hover:-translate-y-0.5">
                <LogOut size={17} />
                Sign out
              </button>
            </form>
          </div>
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
            <AdminTransactionList
              transactions={transactions}
              onEdit={editTransaction}
              onDelete={deleteTransactions}
            />
          </div>
          <aside className="space-y-5">
            <FamilyManagementCard families={families} onChanged={loadData} />
            <KidManagementCard accounts={sortedAccounts} onChanged={loadData} />
            <BalanceAdjustmentCard accounts={sortedAccounts} onAdjusted={loadData} />
            <TransactionForm accounts={sortedAccounts} onSubmit={saveTransaction} />
            <CsvImportCard onImported={loadData} />
          </aside>
        </div>
      </div>
    </main>
  );
}
