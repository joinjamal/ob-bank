"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Baby, LogOut } from "lucide-react";
import dynamic from "next/dynamic";
import { signOutParent } from "@/app/actions";
import ActivityFeed from "@/components/ActivityFeed";
import AuthLoadingOverlay from "@/components/AuthLoadingOverlay";
import BalanceCard from "@/components/BalanceCard";
import LanguageToggle from "@/components/LanguageToggle";
import ParentChildWizard from "@/components/ParentChildWizard";
import ThemeToggle from "@/components/ThemeToggle";
import ToolFrame from "@/components/ToolFrame";
import TransactionForm from "@/components/TransactionForm";
import type { Account, RecurringAllowance, Transaction } from "@/components/types";
import { useI18n } from "@/lib/i18n";

const AdminTransactionList = dynamic(() => import("@/components/AdminTransactionList"), {
  ssr: false,
  loading: () => <section className="surface-card h-40 animate-pulse" />
});
const AutomaticAllowanceCard = dynamic(() => import("@/components/AutomaticAllowanceCard"), { ssr: false });
const BalanceAdjustmentCard = dynamic(() => import("@/components/BalanceAdjustmentCard"), { ssr: false });
const KidManagementCard = dynamic(() => import("@/components/KidManagementCard"), { ssr: false });

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
  familyParents: unknown[];
};

const emptyParentData: ParentData = {
  parent: {
    id: "",
    name: "Parent",
    email: null,
    emailVerifiedAt: null,
    familyId: "",
    familyName: "Family",
    familyAccessToken: "",
    familyAccessLinkId: ""
  },
  accounts: [],
  transactions: [],
  allowances: [],
  familyParents: []
};

export default function ParentPanel({ initialData }: { initialData: ParentData | null }) {
  const { t } = useI18n();
  const [parentData, setParentData] = useState<ParentData>(initialData ?? emptyParentData);
  const [accounts, setAccounts] = useState(initialData?.accounts ?? []);
  const [transactions, setTransactions] = useState(initialData?.transactions ?? []);
  const [allowances, setAllowances] = useState(initialData?.allowances ?? []);
  const [message, setMessage] = useState("");
  const [isChildWizardOpen, setIsChildWizardOpen] = useState(Boolean(initialData && initialData.accounts.length === 0));
  const [hasLoadedData, setHasLoadedData] = useState(Boolean(initialData));
  const [autoWizardChecked, setAutoWizardChecked] = useState(Boolean(initialData));

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
    setParentData(body);
    setAccounts(body.accounts);
    setTransactions(body.transactions);
    setAllowances(body.allowances);
    setHasLoadedData(true);
  }, [t]);

  useEffect(() => {
    if (!initialData) {
      void loadData();
    }
  }, [initialData, loadData]);

  useEffect(() => {
    if (hasLoadedData && !autoWizardChecked) {
      setAutoWizardChecked(true);
      if (accounts.length === 0) {
        setIsChildWizardOpen(true);
      }
    }
  }, [accounts.length, autoWizardChecked, hasLoadedData]);

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
    <main className="app-shell">
      <div className="app-container">
        <header className="app-header">
          <div>
            <Link href="/" className="eyebrow-pill mb-3">
              <ArrowLeft size={17} className="text-mint" />
              {t("kid.dashboard")}
            </Link>
            <h1 className="page-title">
              {t("parent.portal", { name: parentData.parent.name })}
            </h1>
            <p className="page-subtitle">
              {t("parent.controls", { family: parentData.parent.familyName })}
            </p>
          </div>
          <div className="app-actions">
            <button
              type="button"
              onClick={() => setIsChildWizardOpen(true)}
              className="action-button action-mint w-full sm:w-auto"
            >
              <Baby size={17} />
              {t("childWizard.launch")}
            </button>
            <LanguageToggle compact />
            <ThemeToggle compact />
            <form action={signOutParent}>
              <AuthLoadingOverlay title={t("common.signingOut")} message={t("parent.signOutMessage")} />
              <button className="action-button action-primary w-full sm:w-auto">
                <LogOut size={17} />
                {t("parent.signOut")}
              </button>
            </form>
          </div>
        </header>

        {message && <p className="mb-5 rounded-[8px] bg-coral/10 p-4 font-bold text-coral">{message}</p>}
        {!hasLoadedData ? (
          <section className="surface-card mb-4 p-4">
            <div className="h-5 w-40 animate-pulse rounded bg-ink/10" />
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="h-40 animate-pulse rounded-[8px] bg-ink/5" />
              <div className="h-40 animate-pulse rounded-[8px] bg-ink/5" />
            </div>
          </section>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-4">
              <div className="grid min-w-0 gap-4 md:grid-cols-2">
                {sortedAccounts.map((account) => (
                  <BalanceCard key={account.id} account={account} />
                ))}
              </div>
              <ActivityFeed transactions={transactions.slice(0, 12)} compact />
            </div>
            <aside className="min-w-0 space-y-3 xl:sticky xl:top-4 xl:self-start">
              <section className="surface-card p-3">
                <TransactionForm accounts={sortedAccounts} onSubmit={saveTransaction} />
              </section>
              <ToolFrame title={t("parent.editHistory")} description={t("parent.editHistoryDesc")}>
                <AdminTransactionList
                  transactions={transactions}
                  onEdit={editTransaction}
                  onDelete={deleteTransactions}
                />
              </ToolFrame>
              <ToolFrame title={t("parent.moreSettings")} description={t("parent.moreSettingsDesc")}>
                <div className="space-y-3">
                  <BalanceAdjustmentCard accounts={sortedAccounts} onAdjusted={loadData} apiBase="/api/parent/transactions" />
                  <AutomaticAllowanceCard accounts={sortedAccounts} schedules={allowances} onChanged={loadData} />
                  <KidManagementCard accounts={sortedAccounts} onChanged={loadData} apiBase="/api/parent/accounts" />
                </div>
              </ToolFrame>
            </aside>
          </div>
        )}
      </div>
      <ParentChildWizard
        open={isChildWizardOpen}
        onClose={() => setIsChildWizardOpen(false)}
        onCreated={loadData}
      />
    </main>
  );
}
