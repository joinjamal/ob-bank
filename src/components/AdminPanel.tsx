"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { ArrowLeft, LogOut } from "lucide-react";
import { signOutAdmin } from "@/app/actions";
import AdminTransactionList from "@/components/AdminTransactionList";
import FamilyManagementCard, { FamilySummary } from "@/components/FamilyManagementCard";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import ToolFrame from "@/components/ToolFrame";
import { Account, LedgerPoint, Transaction } from "@/components/types";
import { useI18n } from "@/lib/i18n";
import { applyAccountDelta, replacementDelta, transactionDelta } from "@/lib/optimisticMoney";

const AdminAnalytics = dynamic(() => import("@/components/AdminAnalytics"), {
  ssr: false,
  loading: () => (
    <section className="rounded-[8px] bg-white p-5 shadow-lift">
      <div className="h-5 w-44 rounded-full bg-ink/10" />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="h-24 rounded-[8px] bg-ink/5" />
        <div className="h-24 rounded-[8px] bg-ink/5" />
      </div>
    </section>
  )
});

type AdminData = {
  accounts: Account[];
  transactions: Transaction[];
  ledger: LedgerPoint[];
  families: FamilySummary[];
};

export default function AdminPanel({ initialData }: { initialData: AdminData }) {
  const { t } = useI18n();
  const [accounts, setAccounts] = useState<Account[]>(initialData.accounts);
  const [transactions, setTransactions] = useState<Transaction[]>(initialData.transactions);
  const [, setLedger] = useState<LedgerPoint[]>(initialData.ledger);
  const [families, setFamilies] = useState<FamilySummary[]>(initialData.families);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

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
    <main className="super-admin-shell min-h-screen px-3 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <Link href="/" className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-sm font-black shadow-sm">
              <ArrowLeft size={17} className="text-mint" />
              {t("admin.dashboard")}
            </Link>
            <h1 className="text-3xl font-black tracking-normal text-ink sm:text-5xl">{t("admin.title")}</h1>
            <p className="mt-2 max-w-2xl text-base font-bold text-ink/65">
              {t("admin.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap md:justify-end">
            <LanguageToggle compact />
            <ThemeToggle compact />
            <form action={signOutAdmin}>
              <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-ink px-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 sm:w-auto sm:px-4 sm:text-base">
                <LogOut size={17} />
                {t("admin.signOut")}
              </button>
            </form>
          </div>
        </header>

        {error && <p className="mb-5 rounded-[8px] bg-coral/10 p-4 font-bold text-coral">{error}</p>}

        <div className="space-y-5">
          {isRefreshing && (
            <p className="rounded-[8px] bg-white/80 px-4 py-3 text-sm font-black text-ink/55 shadow-sm">
              Updating admin data...
            </p>
          )}
          <AdminAnalytics accounts={sortedAccounts} transactions={transactions} families={families} />
          <AdminTransactionList
            transactions={transactions}
            onEdit={editTransaction}
            onDelete={deleteTransactions}
          />
          <ToolFrame title="Family management" description="Create, inspect, reset, or remove family access when needed.">
            <FamilyManagementCard families={families} onChanged={loadData} />
          </ToolFrame>
        </div>
      </div>
    </main>
  );
}
