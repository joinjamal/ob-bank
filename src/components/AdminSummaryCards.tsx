"use client";

import { ArrowDownCircle, ArrowUpCircle, BadgeDollarSign, ListChecks, TrendingUp } from "lucide-react";
import type { Account, Transaction } from "@/components/types";
import { buildAdminSummary } from "@/lib/insights";
import { useI18n } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";

export default function AdminSummaryCards({
  accounts,
  transactions
}: {
  accounts: Account[];
  transactions: Transaction[];
}) {
  const { t } = useI18n();
  const summary = buildAdminSummary(accounts, transactions);
  const cards = [
    {
      label: t("money.totalInApp"),
      value: formatMoney(summary.totalBalance),
      detail: t("money.kidAccounts", { count: accounts.length }),
      icon: <BadgeDollarSign size={20} />,
      tone: "text-mint bg-mint/12"
    },
    {
      label: t("money.netMovement"),
      value: formatMoney(summary.netMovement),
      detail: t("money.totalEntries", { count: summary.transactionCount }),
      icon: <TrendingUp size={20} />,
      tone: summary.netMovement >= 0 ? "text-mint bg-mint/12" : "text-coral bg-coral/12"
    },
    {
      label: t("money.deposits"),
      value: formatMoney(summary.depositTotal),
      detail: summary.largestDeposit
        ? t("money.largest", {
            name: summary.largestDeposit.accountName,
            amount: formatMoney(summary.largestDeposit.amount)
          })
        : t("money.noDeposits"),
      icon: <ArrowUpCircle size={20} />,
      tone: "text-mint bg-mint/12"
    },
    {
      label: t("money.withdrawals"),
      value: formatMoney(summary.withdrawalTotal),
      detail: summary.largestWithdrawal
        ? t("money.largest", {
            name: summary.largestWithdrawal.accountName,
            amount: formatMoney(summary.largestWithdrawal.amount)
          })
        : t("money.noWithdrawals"),
      icon: <ArrowDownCircle size={20} />,
      tone: "text-coral bg-coral/12"
    }
  ];

  return (
    <section className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="surface-card min-w-0 p-3 sm:p-4">
          <div className={`mb-2 grid h-9 w-9 place-items-center rounded-full ${card.tone}`}>{card.icon}</div>
          <p className="text-[10px] font-black uppercase leading-tight text-ink/45 sm:text-xs">{card.label}</p>
          <p className="mt-1 break-words text-xl font-black text-ink sm:text-2xl">{card.value}</p>
          <p className="mt-1 flex min-w-0 items-start gap-1 text-xs font-bold text-ink/55 sm:text-sm">
            <ListChecks size={14} className="mt-0.5 shrink-0" />
            <span className="min-w-0 break-words">{card.detail}</span>
          </p>
        </article>
      ))}
    </section>
  );
}
