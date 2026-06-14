"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  Activity,
  BadgeDollarSign,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Flame,
  Goal,
  Landmark,
  LineChart,
  PiggyBank,
  ReceiptText,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UsersRound,
  WalletCards
} from "lucide-react";
import type { Account, Transaction } from "@/components/types";
import type { FamilySummary } from "@/components/FamilyManagementCard";
import { formatMoney } from "@/lib/money";

type FamilyMetric = {
  id: string;
  name: string;
  transactions: number;
  deposits: number;
  withdrawals: number;
  net: number;
  balance: number;
  kids: number;
  parents: number;
};

const chartColors = {
  mint: "#3DCC91",
  coral: "#FF765F",
  blue: "#2F7DF6",
  gold: "#E6A400",
  purple: "#8E5CF7"
};

function amount(transaction: Transaction) {
  return Number(transaction.amount) || 0;
}

function parseDate(value: string) {
  return new Date(value);
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function shortMonth(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(undefined, { month: "short" });
}

function isSameDay(date: Date, reference: Date) {
  return dateKey(date) === dateKey(reference);
}

function isSameMonth(date: Date, reference: Date) {
  return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
}

function daysAgo(days: number, reference: Date) {
  const date = new Date(reference);
  date.setDate(date.getDate() - days);
  return date;
}

function monthsAgo(months: number, reference: Date) {
  return new Date(Date.UTC(reference.getFullYear(), reference.getMonth() - months, 1));
}

function buildFamilyMetrics(families: FamilySummary[], accounts: Account[], transactions: Transaction[], reference: Date) {
  const accountFamily = new Map(accounts.map((account) => [account.id, account.familyId]));
  const metrics = new Map<string, FamilyMetric>();

  for (const family of families) {
    metrics.set(family.id, {
      id: family.id,
      name: family.name,
      transactions: 0,
      deposits: 0,
      withdrawals: 0,
      net: 0,
      balance: family.accounts.reduce((total, account) => total + account.currentBalance, 0),
      kids: family.accounts.length,
      parents: family.parents.length
    });
  }

  for (const transaction of transactions) {
    const familyId = accountFamily.get(transaction.accountId);
    if (!familyId || !isSameMonth(parseDate(transaction.date), reference)) continue;
    const metric = metrics.get(familyId);
    if (!metric) continue;
    const value = amount(transaction);
    metric.transactions += 1;
    if (transaction.type === "Deposit") {
      metric.deposits += value;
      metric.net += value;
    } else {
      metric.withdrawals += value;
      metric.net -= value;
    }
  }

  return Array.from(metrics.values());
}

function buildDailyActivity(transactions: Transaction[], reference: Date) {
  const rows = Array.from({ length: 30 }, (_, index) => {
    const date = daysAgo(29 - index, reference);
    return {
      id: dateKey(date),
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      transactions: 0,
      deposits: 0,
      withdrawals: 0
    };
  });
  const rowMap = new Map(rows.map((row) => [row.id, row]));

  for (const transaction of transactions) {
    const row = rowMap.get(dateKey(parseDate(transaction.date)));
    if (!row) continue;
    row.transactions += 1;
    if (transaction.type === "Deposit") row.deposits += 1;
    else row.withdrawals += 1;
  }

  return rows;
}

function buildMonthlyMovement(transactions: Transaction[], reference: Date) {
  const rows = Array.from({ length: 6 }, (_, index) => {
    const date = monthsAgo(5 - index, reference);
    const id = monthKey(date);
    return { id, label: shortMonth(id), deposits: 0, withdrawals: 0, net: 0 };
  });
  const rowMap = new Map(rows.map((row) => [row.id, row]));

  for (const transaction of transactions) {
    const row = rowMap.get(monthKey(parseDate(transaction.date)));
    if (!row) continue;
    const value = amount(transaction);
    if (transaction.type === "Deposit") {
      row.deposits += value;
      row.net += value;
    } else {
      row.withdrawals += value;
      row.net -= value;
    }
  }

  return rows.map((row) => ({
    ...row,
    deposits: Number(row.deposits.toFixed(2)),
    withdrawals: Number(row.withdrawals.toFixed(2)),
    net: Number(row.net.toFixed(2))
  }));
}

export default function AdminAnalytics({
  accounts,
  transactions,
  families
}: {
  accounts: Account[];
  transactions: Transaction[];
  families: FamilySummary[];
}) {
  const now = new Date();
  const todayTransactions = transactions.filter((transaction) => isSameDay(parseDate(transaction.date), now));
  const monthTransactions = transactions.filter((transaction) => isSameMonth(parseDate(transaction.date), now));
  const weekTransactions = transactions.filter((transaction) => parseDate(transaction.date) >= daysAgo(7, now));
  const previousWeekTransactions = transactions.filter((transaction) => {
    const date = parseDate(transaction.date);
    return date >= daysAgo(14, now) && date < daysAgo(7, now);
  });
  const familyMetrics = buildFamilyMetrics(families, accounts, transactions, now);
  const activeFamilies = familyMetrics.filter((family) => family.transactions > 0);
  const mostActiveFamily = [...familyMetrics].sort((a, b) => b.transactions - a.transactions)[0] ?? null;
  const highestBalanceFamily = [...familyMetrics].sort((a, b) => b.balance - a.balance)[0] ?? null;
  const monthlyDeposits = monthTransactions
    .filter((transaction) => transaction.type === "Deposit")
    .reduce((total, transaction) => total + amount(transaction), 0);
  const monthlyWithdrawals = monthTransactions
    .filter((transaction) => transaction.type === "Withdrawal")
    .reduce((total, transaction) => total + amount(transaction), 0);
  const totalBalance = accounts.reduce((total, account) => total + account.currentBalance, 0);
  const goalCount = accounts.filter((account) => account.goalAmount && account.goalAmount > 0).length;
  const savingRate =
    monthlyDeposits + monthlyWithdrawals > 0
      ? Math.round((monthlyDeposits / (monthlyDeposits + monthlyWithdrawals)) * 100)
      : 0;
  const newFamiliesThisMonth = families.filter((family) => isSameMonth(parseDate(family.createdAt), now)).length;
  const largestMonthTransaction = monthTransactions.reduce<Transaction | null>(
    (best, transaction) => (!best || amount(transaction) > amount(best) ? transaction : best),
    null
  );
  const weekTrend = previousWeekTransactions.length
    ? Math.round(((weekTransactions.length - previousWeekTransactions.length) / previousWeekTransactions.length) * 100)
    : weekTransactions.length > 0
      ? 100
      : 0;

  const kpis = [
    { label: "Transactions today", value: String(todayTransactions.length), detail: "Live daily activity", icon: ReceiptText, tone: "mint" },
    { label: "Transactions this month", value: String(monthTransactions.length), detail: `${weekTrend}% vs previous 7 days`, icon: Activity, tone: "blue" },
    { label: "Monthly deposits", value: formatMoney(monthlyDeposits), detail: `${savingRate}% deposit share`, icon: TrendingUp, tone: "mint" },
    { label: "Monthly withdrawals", value: formatMoney(monthlyWithdrawals), detail: "Spending volume", icon: TrendingDown, tone: "coral" },
    { label: "Monthly net", value: formatMoney(monthlyDeposits - monthlyWithdrawals), detail: "Deposits minus withdrawals", icon: LineChart, tone: monthlyDeposits >= monthlyWithdrawals ? "mint" : "coral" },
    { label: "Active families", value: `${activeFamilies.length}/${families.length}`, detail: "Families with movement this month", icon: UsersRound, tone: "purple" },
    { label: "Most active family", value: mostActiveFamily?.name ?? "None", detail: `${mostActiveFamily?.transactions ?? 0} moves this month`, icon: Flame, tone: "gold" },
    { label: "Highest balance family", value: highestBalanceFamily?.name ?? "None", detail: formatMoney(highestBalanceFamily?.balance ?? 0), icon: Landmark, tone: "mint" },
    { label: "Average balance per kid", value: formatMoney(accounts.length ? totalBalance / accounts.length : 0), detail: `${accounts.length} kid accounts`, icon: WalletCards, tone: "blue" },
    { label: "New families this month", value: String(newFamiliesThisMonth), detail: "Self-service signups", icon: Sparkles, tone: "purple" },
    { label: "Families without kids", value: String(families.filter((family) => family.accounts.length === 0).length), detail: "Onboarding follow-up", icon: Clock3, tone: "gold" },
    { label: "Goal adoption", value: `${goalCount}/${accounts.length}`, detail: "Kids with savings goals", icon: Goal, tone: "mint" },
    { label: "Largest move this month", value: formatMoney(largestMonthTransaction ? amount(largestMonthTransaction) : 0), detail: largestMonthTransaction?.accountName ?? "No movement", icon: CircleDollarSign, tone: "blue" },
    { label: "Platform balance", value: formatMoney(totalBalance), detail: "Total across all kids", icon: BadgeDollarSign, tone: "mint" }
  ];

  const dailyActivity = buildDailyActivity(transactions, now);
  const monthlyMovement = buildMonthlyMovement(transactions, now);
  const topFamilies = [...familyMetrics].sort((a, b) => b.transactions - a.transactions).slice(0, 6);
  const mix = [
    { name: "Deposits", value: monthlyDeposits, color: chartColors.mint },
    { name: "Withdrawals", value: monthlyWithdrawals, color: chartColors.coral }
  ];

  return (
    <section className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <article key={kpi.label} className="rounded-[8px] bg-white p-4 shadow-lift">
              <div className={`mb-3 grid h-10 w-10 place-items-center rounded-full ${toneClass(kpi.tone)}`}>
                <Icon size={20} />
              </div>
              <p className="text-xs font-black uppercase text-ink/45">{kpi.label}</p>
              <p className="mt-1 truncate text-2xl font-black text-ink">{kpi.value}</p>
              <p className="mt-1 text-sm font-bold text-ink/55">{kpi.detail}</p>
            </article>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartShell title="Activity pulse" subtitle="Transactions over the last 30 days">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={dailyActivity}>
              <defs>
                <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.mint} stopOpacity={0.45} />
                  <stop offset="95%" stopColor={chartColors.mint} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
              <XAxis dataKey="label" tick={{ fill: "#94A3B8", fontWeight: 800, fontSize: 11 }} interval={5} />
              <YAxis tick={{ fill: "#94A3B8", fontWeight: 800, fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 0, fontWeight: 800 }} />
              <Area type="monotone" dataKey="transactions" stroke={chartColors.mint} strokeWidth={3} fill="url(#activityFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartShell>

        <ChartShell title="Money movement" subtitle="Deposit and withdrawal volume by month">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyMovement}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
              <XAxis dataKey="label" tick={{ fill: "#94A3B8", fontWeight: 800, fontSize: 11 }} />
              <YAxis tick={{ fill: "#94A3B8", fontWeight: 800, fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 0, fontWeight: 800 }} />
              <Legend />
              <Bar dataKey="deposits" fill={chartColors.mint} radius={[6, 6, 0, 0]} />
              <Bar dataKey="withdrawals" fill={chartColors.coral} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartShell>

        <ChartShell title="Most active families" subtitle="Top families by transactions this month">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topFamilies} layout="vertical" margin={{ left: 18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
              <XAxis type="number" tick={{ fill: "#94A3B8", fontWeight: 800, fontSize: 11 }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={96} tick={{ fill: "#94A3B8", fontWeight: 800, fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 0, fontWeight: 800 }} />
              <Bar dataKey="transactions" fill={chartColors.blue} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartShell>

        <ChartShell title="Monthly mix" subtitle="Deposit share versus withdrawals">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={mix} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={4}>
                {mix.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: 0, fontWeight: 800 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartShell>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-[8px] bg-white p-5 shadow-lift">
          <div className="mb-4 flex items-center gap-3">
            <PiggyBank className="text-mint" size={22} />
            <div>
              <h2 className="text-xl font-black text-ink">Family health board</h2>
              <p className="text-sm font-bold text-ink/55">Quick operator view of balances and monthly movement.</p>
            </div>
          </div>
          <div className="space-y-2">
            {[...familyMetrics]
              .sort((a, b) => b.balance - a.balance)
              .slice(0, 8)
              .map((family) => (
                <div key={family.id} className="grid gap-2 rounded-[8px] bg-ink/5 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="font-black text-ink">{family.name}</p>
                    <p className="text-xs font-bold text-ink/50">
                      {family.kids} kids, {family.parents} parents, {family.transactions} moves this month
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-black text-mint">{formatMoney(family.balance)}</p>
                    <p className={`text-xs font-black ${family.net >= 0 ? "text-mint" : "text-coral"}`}>
                      Net {formatMoney(family.net)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </section>

        <section className="rounded-[8px] bg-white p-5 shadow-lift">
          <div className="mb-4 flex items-center gap-3">
            <CalendarDays className="text-mint" size={22} />
            <div>
              <h2 className="text-xl font-black text-ink">Attention queue</h2>
              <p className="text-sm font-bold text-ink/55">Families that may need onboarding or engagement help.</p>
            </div>
          </div>
          <div className="space-y-2">
            {families
              .filter((family) => family.accounts.length === 0 || !familyMetrics.find((metric) => metric.id === family.id)?.transactions)
              .slice(0, 8)
              .map((family) => (
                <div key={family.id} className="rounded-[8px] bg-ink/5 p-3">
                  <p className="font-black text-ink">{family.name}</p>
                  <p className="text-xs font-bold text-ink/50">
                    {family.accounts.length === 0 ? "No kids added yet" : "No transactions this month"}
                  </p>
                </div>
              ))}
            {families.every((family) => family.accounts.length > 0 && familyMetrics.find((metric) => metric.id === family.id)?.transactions) && (
              <p className="rounded-[8px] bg-mint/10 p-3 font-bold text-mint">Every family is active this month.</p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

function toneClass(tone: string) {
  if (tone === "coral") return "bg-coral/12 text-coral";
  if (tone === "blue") return "bg-[#2F7DF6]/12 text-[#2F7DF6]";
  if (tone === "gold") return "bg-[#E6A400]/12 text-[#E6A400]";
  if (tone === "purple") return "bg-[#8E5CF7]/12 text-[#8E5CF7]";
  return "bg-mint/12 text-mint";
}

function ChartShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[8px] bg-white p-5 shadow-lift">
      <div className="mb-4">
        <h2 className="text-xl font-black text-ink">{title}</h2>
        <p className="text-sm font-bold text-ink/55">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}
