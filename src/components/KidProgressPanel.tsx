"use client";

import { Award, BadgeCheck, Coins, LockKeyhole, Sparkles, Target, WalletCards } from "lucide-react";
import type { ReactNode } from "react";
import type { Account, Transaction } from "@/components/types";
import { formatMoney } from "@/lib/money";
import { KidInsight, buildKidInsights } from "@/lib/insights";

export default function KidProgressPanel({
  accounts,
  transactions
}: {
  accounts: Account[];
  transactions: Transaction[];
}) {
  const insights = buildKidInsights(accounts, transactions);

  return (
    <section className="rounded-[8px] bg-white p-5 shadow-lift">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-mint/10 px-3 py-1 text-sm font-black text-mint">
            <Sparkles size={16} />
            Vault quests
          </div>
          <h2 className="text-2xl font-black text-ink">Vault quests</h2>
          <p className="text-sm font-bold text-ink/55">Easy wins that make saving feel good.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {insights.map((insight) => (
          <article key={insight.account.id} className="rounded-[8px] border border-ink/5 bg-cream/55 p-4">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <img
                    src={insight.account.avatarUrl}
                    alt={`${insight.account.name} avatar`}
                    className="h-14 w-14 rounded-full border-4 border-white object-cover shadow-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-black text-ink">{insight.account.name}</p>
                    <p className="text-sm font-bold text-ink/55">Vault level {insight.level}</p>
                  </div>
                  <div className="rounded-[8px] bg-white px-3 py-2 text-right shadow-sm">
                    <p className="text-xs font-black uppercase text-ink/45">Vault money</p>
                    <p className="text-xl font-black text-mint">{formatMoney(insight.account.currentBalance)}</p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <Stat
                    icon={<WalletCards size={16} />}
                    label="In my vault"
                    value={formatMoney(insight.account.currentBalance)}
                    detail="What I have now"
                  />
                  <Stat
                    icon={<Target size={16} />}
                    label={insight.account.goalName ? "Goal left" : "Goal"}
                    value={insight.account.goalName ? formatMoney(insight.goalRemaining) : "Pick one"}
                    detail={insight.account.goalName || "Choose something fun"}
                  />
                  <Stat
                    icon={<Coins size={16} />}
                    label="Kept this month"
                    value={formatMoney(insight.monthlyDeposits - insight.monthlyWithdrawals)}
                    detail="Added minus spent"
                  />
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs font-black text-ink/55">
                    <span>{insight.account.goalName ? `${insight.account.goalName} progress` : "Next vault level"}</span>
                    <span>{insight.account.goalName ? `${insight.goalProgress}%` : `${insight.xp}%`}</span>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full bg-ink/10">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${insight.account.goalName ? insight.goalProgress : insight.xp}%`,
                        backgroundColor: insight.account.themeColor
                      }}
                    />
                  </div>
                  <p className="mt-2 text-sm font-bold text-ink/50">{getQuestPrompt(insight)}</p>
                </div>
              </div>

              <div className="rounded-[8px] bg-white p-3 shadow-sm">
                <p className="mb-3 inline-flex items-center gap-2 text-sm font-black text-ink">
                  <Award size={16} className="text-[#FFC64E]" />
                  Badge shelf
                </p>
                <div className="grid gap-2">
                  {getBadgeShelf(insight).map((badge) => (
                    <div
                      key={badge.label}
                      className={`flex items-center gap-2 rounded-[8px] px-3 py-2 text-sm font-black ${
                        badge.earned
                          ? "earned-badge bg-mint/10 text-mint"
                          : "bg-ink/5 text-ink/40"
                      }`}
                    >
                      {badge.earned ? <BadgeCheck size={17} /> : <LockKeyhole size={17} />}
                      <div className="min-w-0 flex-1">
                        <p>{badge.label}</p>
                        <p className="text-xs font-bold opacity-70">{badge.help}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Stat({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[8px] bg-white p-3 shadow-sm">
      <p className="mb-1 inline-flex items-center gap-1 text-xs font-black uppercase text-ink/45">
        {icon}
        {label}
      </p>
      <p className="text-lg font-black text-ink">{value}</p>
      <p className="mt-1 text-xs font-bold text-ink/50">{detail}</p>
    </div>
  );
}

function getQuestPrompt(insight: KidInsight) {
  if (!insight.account.goalName) return "Set a goal so your vault has a target.";
  if (insight.goalProgress >= 100) return "Goal reached. Time to celebrate or pick a new one.";
  if (insight.goalRemaining <= 25) return `Almost there. ${formatMoney(insight.goalRemaining)} left.`;
  return `Keep going. ${formatMoney(insight.goalRemaining)} left for ${insight.account.goalName}.`;
}

function getBadgeShelf(insight: KidInsight) {
  return [
    {
      label: "First Save",
      help: "Add money once",
      earned: insight.depositCount >= 1
    },
    {
      label: "Goal Picker",
      help: "Choose a saving goal",
      earned: Boolean(insight.account.goalName)
    },
    {
      label: "Halfway Hero",
      help: "Reach 50% of a goal",
      earned: insight.goalProgress >= 50
    },
    {
      label: "Careful Spender",
      help: "Keep some money this month",
      earned: insight.monthlyDeposits - insight.monthlyWithdrawals > 0
    },
    {
      label: "Goal Champion",
      help: "Finish a goal",
      earned: insight.goalProgress >= 100
    }
  ];
}
