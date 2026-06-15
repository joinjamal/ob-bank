"use client";

import { Award, BadgeCheck, Coins, LockKeyhole, Sparkles, Target, WalletCards } from "lucide-react";
import type { ReactNode } from "react";
import type { Account, Transaction } from "@/components/types";
import { KidInsight, buildKidInsights } from "@/lib/insights";
import { useI18n } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";

export default function KidProgressPanel({
  accounts,
  transactions
}: {
  accounts: Account[];
  transactions: Transaction[];
}) {
  const { t } = useI18n();
  const insights = buildKidInsights(accounts, transactions);

  return (
    <section className="surface-card p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-mint/10 px-3 py-1 text-sm font-black text-mint">
            <Sparkles size={16} />
            {t("kidQuest.vaultQuests")}
          </div>
          <h2 className="section-heading">{t("kidQuest.title")}</h2>
          <p className="section-copy">{t("kidQuest.subtitle")}</p>
        </div>
      </div>

      <div className="grid gap-4">
        {insights.map((insight) => (
          <article key={insight.account.id} className="rounded-[8px] border border-ink/5 bg-ink/[0.03] p-4">
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
                  <div className="rounded-[8px] bg-white/70 px-3 py-2 text-right shadow-sm">
                    <p className="text-xs font-black uppercase text-ink/45">{t("kidQuest.vaultMoney")}</p>
                    <p className="text-xl font-black text-mint">{formatMoney(insight.account.currentBalance)}</p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <Stat
                    icon={<WalletCards size={16} />}
                    label={t("kidQuest.inMyVault")}
                    value={formatMoney(insight.account.currentBalance)}
                    detail={t("kidQuest.whatIHave")}
                  />
                  <Stat
                    icon={<Target size={16} />}
                    label={insight.account.goalName ? t("kidQuest.goalLeft") : t("kidQuest.goal")}
                    value={insight.account.goalName ? formatMoney(insight.goalRemaining) : t("kidQuest.pickOne")}
                    detail={insight.account.goalName || t("kidQuest.chooseSomething")}
                  />
                  <Stat
                    icon={<Coins size={16} />}
                    label={t("kidQuest.keptThisMonth")}
                    value={formatMoney(insight.monthlyDeposits - insight.monthlyWithdrawals)}
                    detail={t("kidQuest.addedMinusSpent")}
                  />
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs font-black text-ink/55">
                    <span>
                      {insight.account.goalName
                        ? t("kidQuest.progress", { goal: insight.account.goalName })
                        : t("kidQuest.nextLevel")}
                    </span>
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
                  <p className="mt-2 text-sm font-bold text-ink/50">{getQuestPrompt(insight, t)}</p>
                </div>
              </div>

              <div className="rounded-[8px] bg-white/70 p-3 shadow-sm">
                <p className="mb-3 inline-flex items-center gap-2 text-sm font-black text-ink">
                  <Award size={16} className="text-[#FFC64E]" />
                  {t("kidQuest.badgeShelf")}
                </p>
                <div className="grid gap-2">
                  {getBadgeShelf(insight, t).map((badge) => (
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

function getQuestPrompt(insight: KidInsight, t: (key: string, replacements?: Record<string, string | number>) => string) {
  if (!insight.account.goalName) return t("kidQuest.promptSetGoal");
  if (insight.goalProgress >= 100) return t("kidQuest.promptReached");
  if (insight.goalRemaining <= 25) return t("kidQuest.promptAlmost", { amount: formatMoney(insight.goalRemaining) });
  return t("kidQuest.promptKeepGoing", {
    amount: formatMoney(insight.goalRemaining),
    goal: insight.account.goalName
  });
}

function getBadgeShelf(insight: KidInsight, t: (key: string) => string) {
  return [
    {
      label: t("kidQuest.firstSave"),
      help: t("kidQuest.firstSaveHelp"),
      earned: insight.depositCount >= 1
    },
    {
      label: t("kidQuest.goalPicker"),
      help: t("kidQuest.goalPickerHelp"),
      earned: Boolean(insight.account.goalName)
    },
    {
      label: t("kidQuest.halfwayHero"),
      help: t("kidQuest.halfwayHeroHelp"),
      earned: insight.goalProgress >= 50
    },
    {
      label: t("kidQuest.carefulSpender"),
      help: t("kidQuest.carefulSpenderHelp"),
      earned: insight.monthlyDeposits - insight.monthlyWithdrawals > 0
    },
    {
      label: t("kidQuest.goalChampion"),
      help: t("kidQuest.goalChampionHelp"),
      earned: insight.goalProgress >= 100
    }
  ];
}
