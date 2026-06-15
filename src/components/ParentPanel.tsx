"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ArrowLeft, LogOut } from "lucide-react";
import { signOutParent } from "@/app/actions";
import AdminSummaryCards from "@/components/AdminSummaryCards";
import AdminTransactionList from "@/components/AdminTransactionList";
import AutomaticAllowanceCard from "@/components/AutomaticAllowanceCard";
import AuthLoadingOverlay from "@/components/AuthLoadingOverlay";
import BalanceAdjustmentCard from "@/components/BalanceAdjustmentCard";
import BalanceCard from "@/components/BalanceCard";
import FamilyAccessLinkCard from "@/components/FamilyAccessLinkCard";
import FamilyParentsCard, { type FamilyParent } from "@/components/FamilyParentsCard";
import KidManagementCard from "@/components/KidManagementCard";
import LanguageToggle from "@/components/LanguageToggle";
import ParentOnboardingCard from "@/components/ParentOnboardingCard";
import ParentSecurityCard from "@/components/ParentSecurityCard";
import ThemeToggle from "@/components/ThemeToggle";
import ToolFrame from "@/components/ToolFrame";
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
  familyParents: FamilyParent[];
};

export default function ParentPanel({ initialData }: { initialData: ParentData }) {
  const { t } = useI18n();
  const [accounts, setAccounts] = useState(initialData.accounts);
  const [transactions, setTransactions] = useState(initialData.transactions);
  const [allowances, setAllowances] = useState(initialData.allowances);
  const [familyParents, setFamilyParents] = useState(initialData.familyParents);
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
    setFamilyParents(body.familyParents);
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
    <main className="app-shell">
      <div className="app-container">
        <header className="app-header">
          <div>
            <Link href="/" className="eyebrow-pill mb-3">
              <ArrowLeft size={17} className="text-mint" />
              {t("kid.dashboard")}
            </Link>
            <h1 className="page-title">
              {t("parent.portal", { name: initialData.parent.name })}
            </h1>
            <p className="page-subtitle">
              {t("parent.controls", { family: initialData.parent.familyName })}
            </p>
          </div>
          <div className="app-actions">
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

        <div className="control-grid">
          <div className="min-w-0 space-y-5">
            <AdminSummaryCards accounts={sortedAccounts} transactions={transactions} />
            <div className="grid min-w-0 gap-5 md:grid-cols-2">
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
          <aside className="min-w-0 space-y-3">
            <ToolFrame title={t("parent.addMoneyMove")} description={t("parent.addMoneyMoveDesc")} defaultOpen>
              <TransactionForm accounts={sortedAccounts} onSubmit={saveTransaction} />
            </ToolFrame>
            <ToolFrame title={t("parent.balanceCorrection")} description={t("parent.balanceCorrectionDesc")}>
              <BalanceAdjustmentCard accounts={sortedAccounts} onAdjusted={loadData} apiBase="/api/parent/transactions" />
            </ToolFrame>
            <ToolFrame title={t("parent.automaticAllowance")} description={t("parent.automaticAllowanceDesc")}>
              <AutomaticAllowanceCard accounts={sortedAccounts} schedules={allowances} onChanged={loadData} />
            </ToolFrame>
            <ToolFrame title={t("parent.kids")} description={t("parent.kidsDesc")}>
              <KidManagementCard accounts={sortedAccounts} onChanged={loadData} apiBase="/api/parent/accounts" />
            </ToolFrame>
            <ToolFrame title={t("parent.shareAccess")} description={t("parent.shareAccessDesc")}>
              <FamilyParentsCard parents={familyParents} onChanged={loadData} />
              <FamilyAccessLinkCard
                familyName={initialData.parent.familyName}
                token={initialData.parent.familyAccessToken}
              />
            </ToolFrame>
            <ToolFrame title={t("parent.setupChecks")} description={t("parent.setupChecksDesc")}>
              <ParentOnboardingCard accounts={sortedAccounts} allowances={allowances} />
              <ParentSecurityCard
                transactions={transactions}
              />
            </ToolFrame>
          </aside>
        </div>
      </div>
    </main>
  );
}
