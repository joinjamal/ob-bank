"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ArrowLeft, LogOut } from "lucide-react";
import { signOutParent } from "@/app/actions";
import AdminSummaryCards from "@/components/AdminSummaryCards";
import AdminTransactionList from "@/components/AdminTransactionList";
import AutomaticAllowanceCard from "@/components/AutomaticAllowanceCard";
import BalanceAdjustmentCard from "@/components/BalanceAdjustmentCard";
import BalanceCard from "@/components/BalanceCard";
import FamilyAccessLinkCard from "@/components/FamilyAccessLinkCard";
import KidManagementCard from "@/components/KidManagementCard";
import LanguageToggle from "@/components/LanguageToggle";
import ParentOnboardingCard from "@/components/ParentOnboardingCard";
import ParentSecurityCard from "@/components/ParentSecurityCard";
import ThemeToggle from "@/components/ThemeToggle";
import TransactionForm from "@/components/TransactionForm";
import type { Account, RecurringAllowance, Transaction } from "@/components/types";
import { useI18n } from "@/lib/i18n";

type ParentData = {
  parent: {
    id: string;
    name: string;
    email: string | null;
    emailVerifiedAt: string | null;
    familyId: string;
    familyName: string;
    familyAccessToken: string;
    familyAccessLinkId: string;
  };
  accounts: Account[];
  transactions: Transaction[];
  allowances: RecurringAllowance[];
};

export default function ParentPanel({ initialData }: { initialData: ParentData }) {
  const { t } = useI18n();
  const [accounts, setAccounts] = useState(initialData.accounts);
  const [transactions, setTransactions] = useState(initialData.transactions);
  const [allowances, setAllowances] = useState(initialData.allowances);
  const [message, setMessage] = useState("");

  const sortedAccounts = useMemo(
    () => [...accounts].sort((a, b) => a.name.localeCompare(b.name)),
    [accounts]
  );

  const loadData = useCallback(async () => {
    const response = await fetch("/api/parent/dashboard", { cache: "no-store" });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(body?.message ?? t("parent.refreshError"));
      return;
    }
    setAccounts(body.accounts);
    setTransactions(body.transactions);
    setAllowances(body.allowances);
  }, [t]);

  async function saveTransaction(payload: {
    accountId: string;
    type: "Deposit" | "Withdrawal";
    amount: number;
    reason?: string;
  }) {
    const response = await fetch("/api/parent/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(body?.message ?? "Could not save transaction.");
    }
    await loadData();
  }

  async function editTransaction(transactionId: string, payload: { type: "Deposit" | "Withdrawal"; amount: number; reason: string }) {
    const response = await fetch(`/api/parent/transactions/${transactionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(body?.message ?? "Could not update transaction.");
      return;
    }
    await loadData();
  }

  async function deleteTransactions(items: Transaction[]) {
    if (items.length === 0) return;

    const endpoint =
      items.length === 1 ? `/api/parent/transactions/${items[0].id}` : "/api/parent/transactions/bulk-delete";
    const options =
      items.length === 1
        ? { method: "DELETE" }
        : {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: items.map((item) => item.id) })
          };

    const response = await fetch(endpoint, options);
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(body?.message ?? "Could not delete transaction.");
      return;
    }
    await loadData();
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/" className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-sm font-black shadow-sm">
              <ArrowLeft size={17} className="text-mint" />
              {t("kid.dashboard")}
            </Link>
            <h1 className="text-4xl font-black tracking-normal text-ink sm:text-5xl">
              {t("parent.portal", { name: initialData.parent.name })}
            </h1>
            <p className="mt-2 max-w-2xl text-base font-bold text-ink/65">
              {t("parent.controls", { family: initialData.parent.familyName })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <LanguageToggle compact />
            <ThemeToggle compact />
            <form action={signOutParent}>
              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-ink px-4 font-black text-white shadow-sm transition hover:-translate-y-0.5">
                <LogOut size={17} />
                {t("parent.signOut")}
              </button>
            </form>
          </div>
        </header>

        {message && <p className="mb-5 rounded-[8px] bg-coral/10 p-4 font-bold text-coral">{message}</p>}

        <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
          <div className="space-y-5">
            <AdminSummaryCards accounts={sortedAccounts} transactions={transactions} />
            <div className="grid gap-5 md:grid-cols-2">
              {sortedAccounts.map((account) => (
                <BalanceCard key={account.id} account={account} />
              ))}
            </div>
            <AdminTransactionList
              transactions={transactions}
              onEdit={editTransaction}
              onDelete={deleteTransactions}
            />
          </div>
          <aside className="space-y-5">
            <ParentOnboardingCard accounts={sortedAccounts} allowances={allowances} />
            <FamilyAccessLinkCard
              familyName={initialData.parent.familyName}
              token={initialData.parent.familyAccessToken}
            />
            <AutomaticAllowanceCard accounts={sortedAccounts} schedules={allowances} onChanged={loadData} />
            <ParentSecurityCard
              email={initialData.parent.email}
              emailVerifiedAt={initialData.parent.emailVerifiedAt}
              transactions={transactions}
            />
            <KidManagementCard accounts={sortedAccounts} onChanged={loadData} apiBase="/api/parent/accounts" />
            <BalanceAdjustmentCard accounts={sortedAccounts} onAdjusted={loadData} apiBase="/api/parent/transactions" />
            <TransactionForm accounts={sortedAccounts} onSubmit={saveTransaction} />
          </aside>
        </div>
      </div>
    </main>
  );
}
