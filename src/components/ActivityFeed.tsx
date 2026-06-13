"use client";

import { formatDistanceToNow } from "date-fns";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Transaction } from "@/components/types";
import { formatMoney } from "@/lib/money";

export default function ActivityFeed({
  transactions,
  compact = false
}: {
  transactions: Transaction[];
  compact?: boolean;
}) {
  const visibleTransactions = compact ? transactions.slice(0, 8) : transactions;

  return (
    <section className="rounded-[8px] bg-white p-5 shadow-lift">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Recent activity</h2>
          <p className="text-sm font-bold text-ink/55">
            {compact ? "A quick look at the latest money moves." : "The full allowance history."}
          </p>
        </div>
      </div>
      <div className={`${compact ? "max-h-[330px]" : "max-h-[560px]"} space-y-3 overflow-y-auto pr-1`}>
        {visibleTransactions.length === 0 ? (
          <p className="rounded-[8px] bg-ink/5 p-4 text-sm font-bold text-ink/60">No transactions yet.</p>
        ) : (
          visibleTransactions.map((transaction) => {
            const isDeposit = transaction.type === "Deposit";
            const Icon = isDeposit ? ArrowUpCircle : ArrowDownCircle;

            return (
              <article
                key={transaction.id}
                className="flex items-center gap-3 rounded-[8px] border border-ink/5 bg-white p-3 shadow-sm"
              >
                <div
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
                    isDeposit ? "bg-mint/15 text-mint" : "bg-coral/15 text-coral"
                  }`}
                >
                  <Icon size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black">{transaction.reason || "Quick balance update"}</p>
                  <p className="text-sm font-bold text-ink/50">
                    {transaction.accountName} -{" "}
                    {formatDistanceToNow(new Date(transaction.date), { addSuffix: true })}
                  </p>
                </div>
                <p className={`text-right text-lg font-black ${isDeposit ? "text-mint" : "text-coral"}`}>
                  {isDeposit ? "+" : "-"}
                  {formatMoney(transaction.amount)}
                </p>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
