"use client";

import { ArrowDownCircle, ArrowUpCircle, BadgeDollarSign, ListChecks, TrendingUp } from "lucide-react";
import type { Account, Transaction } from "@/components/types";
import type { FamilySummary } from "@/components/FamilyManagementCard";
import { buildAdminSummary } from "@/lib/insights";
import { formatMoney } from "@/lib/money";

export default function AdminSummaryCards({
  accounts,
  transactions,
  families = []
}: {
  accounts: Account[];
  transactions: Transaction[];
  families?: FamilySummary[];
}) {
  const summary = buildAdminSummary(accounts, transactions);
  const cards = [
    {
      label: "Families",
      value: String(families.length),
      detail: `${families.reduce((total, family) => total + family.parents.length, 0)} parent profiles`,
      icon: <ListChecks size={20} />,
      tone: "text-mint bg-mint/12"
    },
    {
      label: "Total in OB Bank",
      value: formatMoney(summary.totalBalance),
      detail: `${accounts.length} kid accounts`,
      icon: <BadgeDollarSign size={20} />,
      tone: "text-mint bg-mint/12"
    },
    {
      label: "Net movement",
      value: formatMoney(summary.netMovement),
      detail: `${summary.transactionCount} total entries`,
      icon: <TrendingUp size={20} />,
      tone: summary.netMovement >= 0 ? "text-mint bg-mint/12" : "text-coral bg-coral/12"
    },
    {
      label: "Deposits",
      value: formatMoney(summary.depositTotal),
      detail: summary.largestDeposit
        ? `Largest: ${summary.largestDeposit.accountName} ${formatMoney(summary.largestDeposit.amount)}`
        : "No deposits yet",
      icon: <ArrowUpCircle size={20} />,
      tone: "text-mint bg-mint/12"
    },
    {
      label: "Withdrawals",
      value: formatMoney(summary.withdrawalTotal),
      detail: summary.largestWithdrawal
        ? `Largest: ${summary.largestWithdrawal.accountName} ${formatMoney(summary.largestWithdrawal.amount)}`
        : "No withdrawals yet",
      icon: <ArrowDownCircle size={20} />,
      tone: "text-coral bg-coral/12"
    }
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="rounded-[8px] bg-white p-4 shadow-lift">
          <div className={`mb-3 grid h-10 w-10 place-items-center rounded-full ${card.tone}`}>{card.icon}</div>
          <p className="text-xs font-black uppercase text-ink/45">{card.label}</p>
          <p className="mt-1 text-2xl font-black text-ink">{card.value}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-ink/55">
            <ListChecks size={14} />
            {card.detail}
          </p>
        </article>
      ))}
    </section>
  );
}
