"use client";

"use client";

import { formatDistanceToNow } from "date-fns";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Transaction } from "@/components/types";
import { useI18n } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";

function getEmojiForReason(reason: string): string {
  const lowercase = reason.toLowerCase();
  if (lowercase.includes("allowance")) return "💰";
  if (lowercase.includes("interest")) return "📈";
  if (lowercase.includes("book") || lowercase.includes("school") || lowercase.includes("read")) return "📚";
  if (lowercase.includes("toy") || lowercase.includes("lego") || lowercase.includes("doll")) return "🧸";
  if (lowercase.includes("ice cream") || lowercase.includes("candy") || lowercase.includes("chocolate") || lowercase.includes("snack") || lowercase.includes("food") || lowercase.includes("fair")) return "🍦";
  if (lowercase.includes("gift") || lowercase.includes("birthday") || lowercase.includes("present")) return "🎁";
  if (lowercase.includes("chore") || lowercase.includes("task") || lowercase.includes("clean") || lowercase.includes("help")) return "🧹";
  if (lowercase.includes("game") || lowercase.includes("roblox") || lowercase.includes("fortnite") || lowercase.includes("vbuck") || lowercase.includes("switch")) return "🎮";
  if (lowercase.includes("movie") || lowercase.includes("cinema") || lowercase.includes("show")) return "🎬";
  if (lowercase.includes("sport") || lowercase.includes("soccer") || lowercase.includes("football") || lowercase.includes("basketball")) return "⚽";
  if (lowercase.includes("deposit") || lowercase.includes("save")) return "📥";
  if (lowercase.includes("spend") || lowercase.includes("withdraw") || lowercase.includes("bought")) return "💸";
  return "";
}

export default function ActivityFeed({
  transactions,
  compact = false
}: {
  transactions: Transaction[];
  compact?: boolean;
}) {
  const { t } = useI18n();
  const visibleTransactions = compact ? transactions.slice(0, 8) : transactions;

  return (
    <section className="surface-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="section-heading">{t("activity.recent")}</h2>
          <p className="section-copy">
            {compact ? t("activity.compactSubtitle") : t("activity.fullSubtitle")}
          </p>
        </div>
      </div>
      <div className={`${compact ? "max-h-[330px]" : "max-h-[560px]"} space-y-3 overflow-y-auto pr-1`}>
        {visibleTransactions.length === 0 ? (
          <p className="rounded-[8px] bg-ink/5 p-4 text-sm font-bold text-ink/60">{t("activity.empty")}</p>
        ) : (
          visibleTransactions.map((transaction) => {
            const isDeposit = transaction.type === "Deposit";
            const Icon = isDeposit ? ArrowUpCircle : ArrowDownCircle;
            const emoji = getEmojiForReason(transaction.reason || "");
            const displayReason = transaction.reason
              ? (emoji ? `${emoji} ${transaction.reason}` : transaction.reason)
              : t("activity.balanceUpdate");

            return (
              <article
                key={transaction.id}
                className="quiet-card flex items-center gap-3 p-3"
              >
                <div
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
                    isDeposit ? "bg-mint/15 text-mint" : "bg-coral/15 text-coral"
                  }`}
                >
                  <Icon size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black">{displayReason}</p>
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
