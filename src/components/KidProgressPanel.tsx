"use client";

import { Award, Flame, Lightbulb, Sparkles, Target, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import type { Account, Transaction } from "@/components/types";
import { formatMoney } from "@/lib/money";
import { buildKidInsights } from "@/lib/insights";

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
          <h2 className="text-2xl font-black text-ink">Today&apos;s progress</h2>
          <p className="text-sm font-bold text-ink/55">Small saves become bigger choices.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {insights.map((insight) => (
          <article key={insight.account.id} className="rounded-[8px] border border-ink/5 bg-cream/55 p-4">
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
                <p className="text-xs font-black uppercase text-ink/45">Save rate</p>
                <p className="text-xl font-black text-mint">{insight.savingsRate}%</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Stat icon={<TrendingUp size={16} />} label="This month saved" value={formatMoney(insight.monthlyDeposits)} />
              <Stat icon={<Target size={16} />} label="Goal progress" value={`${insight.goalProgress}%`} />
              <Stat icon={<Flame size={16} />} label="Deposit streak" value={`${insight.streakDays} day${insight.streakDays === 1 ? "" : "s"}`} />
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs font-black text-ink/55">
                <span>Level progress</span>
                <span>{insight.xp}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${insight.xp}%`, backgroundColor: insight.account.themeColor }}
                />
              </div>
              <p className="mt-2 text-xs font-bold text-ink/50">
                Next milestone: {formatMoney(insight.nextMilestone)}
              </p>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-[8px] bg-white p-3 shadow-sm">
                <p className="mb-1 inline-flex items-center gap-2 text-sm font-black text-ink">
                  <Award size={16} className="text-[#FFC64E]" />
                  Badges
                </p>
                <div className="flex flex-wrap gap-2">
                  {insight.badges.length === 0 ? (
                    <span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-black text-ink/50">
                      Make a save to unlock one
                    </span>
                  ) : (
                    insight.badges.map((badge) => (
                      <span key={badge} className="rounded-full bg-mint/10 px-3 py-1 text-xs font-black text-mint">
                        {badge}
                      </span>
                    ))
                  )}
                </div>
              </div>
              <div className="rounded-[8px] bg-white p-3 shadow-sm">
                <p className="mb-1 inline-flex items-center gap-2 text-sm font-black text-ink">
                  <Lightbulb size={16} className="text-[#FFC64E]" />
                  Mission
                </p>
                <p className="text-sm font-bold text-ink/60">{insight.mission}</p>
              </div>
            </div>

            <p className="mt-3 rounded-[8px] bg-ink/5 px-3 py-2 text-sm font-bold text-ink/60">
              {insight.tip}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-white p-3 shadow-sm">
      <p className="mb-1 inline-flex items-center gap-1 text-xs font-black uppercase text-ink/45">
        {icon}
        {label}
      </p>
      <p className="text-lg font-black text-ink">{value}</p>
    </div>
  );
}
