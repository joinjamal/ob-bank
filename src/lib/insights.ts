import type { Account, LedgerPoint, Transaction } from "@/components/types";

export type KidInsight = {
  account: Account;
  deposits: number;
  withdrawals: number;
  netSaved: number;
  monthlyDeposits: number;
  monthlyWithdrawals: number;
  savingsRate: number;
  moveCount: number;
  depositCount: number;
  withdrawalCount: number;
  bestDeposit: number;
  streakDays: number;
  goalProgress: number;
  goalRemaining: number;
  nextMilestone: number;
  level: number;
  xp: number;
  badges: string[];
  mission: string;
  tip: string;
};

export type AdminSummary = {
  totalBalance: number;
  depositTotal: number;
  withdrawalTotal: number;
  netMovement: number;
  transactionCount: number;
  largestDeposit: Transaction | null;
  largestWithdrawal: Transaction | null;
};

function amountFor(transaction: Transaction) {
  return Number(transaction.amount) || 0;
}

function sameMonth(date: Date, reference: Date) {
  return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDepositStreak(transactions: Transaction[], reference = new Date()) {
  const depositDays = new Set(
    transactions
      .filter((transaction) => transaction.type === "Deposit")
      .map((transaction) => dayKey(new Date(transaction.date)))
  );
  let streak = 0;
  const cursor = new Date(reference);

  for (let index = 0; index < 60; index += 1) {
    const key = dayKey(cursor);
    if (!depositDays.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getBadges({
  account,
  depositCount,
  withdrawalCount,
  bestDeposit,
  streakDays,
  goalProgress,
  savingsRate
}: {
  account: Account;
  depositCount: number;
  withdrawalCount: number;
  bestDeposit: number;
  streakDays: number;
  goalProgress: number;
  savingsRate: number;
}) {
  const badges: string[] = [];

  if (depositCount >= 1) badges.push("First save");
  if (depositCount >= 5) badges.push("Save streak");
  if (depositCount >= 15) badges.push("Vault builder");
  if (bestDeposit >= 100) badges.push("Big saver");
  if (streakDays >= 3) badges.push(`${streakDays}-day streak`);
  if (goalProgress >= 50) badges.push("Halfway hero");
  if (goalProgress >= 100) badges.push("Goal crusher");
  if (savingsRate >= 70 && depositCount + withdrawalCount >= 4) badges.push("Smart spender");
  if (account.currentBalance >= 1000) badges.push("1K club");

  return badges.slice(0, 5);
}

function getMission(insight: Pick<KidInsight, "goalRemaining" | "goalProgress" | "depositCount" | "withdrawalCount" | "monthlyDeposits">) {
  if (insight.goalProgress >= 100) return "Pick a fresh goal and keep the streak alive.";
  if (insight.goalRemaining > 0 && insight.goalRemaining <= 50) return "One small save can finish this goal.";
  if (insight.depositCount === 0) return "Make the first save and start the trail.";
  if (insight.withdrawalCount > insight.depositCount) return "Try one save before the next spend.";
  if (insight.monthlyDeposits < 100) return "Reach 100 saved this month.";
  return "Protect the vault for one more week.";
}

function getTip(savingsRate: number, goalProgress: number) {
  if (goalProgress >= 100) return "A reached goal is a good moment to split money between saving and fun.";
  if (savingsRate >= 75) return "Your save rate is strong. Keep spending on things you truly want.";
  if (savingsRate >= 50) return "You are balancing saving and spending well.";
  return "Try saving a little before spending so the trail keeps climbing.";
}

export function buildKidInsights(accounts: Account[], transactions: Transaction[], reference = new Date()): KidInsight[] {
  return accounts.map((account) => {
    const kidTransactions = transactions.filter((transaction) => transaction.accountId === account.id);
    const deposits = kidTransactions
      .filter((transaction) => transaction.type === "Deposit")
      .reduce((total, transaction) => total + amountFor(transaction), 0);
    const withdrawals = kidTransactions
      .filter((transaction) => transaction.type === "Withdrawal")
      .reduce((total, transaction) => total + amountFor(transaction), 0);
    const thisMonth = kidTransactions.filter((transaction) => sameMonth(new Date(transaction.date), reference));
    const monthlyDeposits = thisMonth
      .filter((transaction) => transaction.type === "Deposit")
      .reduce((total, transaction) => total + amountFor(transaction), 0);
    const monthlyWithdrawals = thisMonth
      .filter((transaction) => transaction.type === "Withdrawal")
      .reduce((total, transaction) => total + amountFor(transaction), 0);
    const depositCount = kidTransactions.filter((transaction) => transaction.type === "Deposit").length;
    const withdrawalCount = kidTransactions.filter((transaction) => transaction.type === "Withdrawal").length;
    const bestDeposit = kidTransactions
      .filter((transaction) => transaction.type === "Deposit")
      .reduce((best, transaction) => Math.max(best, amountFor(transaction)), 0);
    const totalMoved = deposits + withdrawals;
    const savingsRate = totalMoved > 0 ? Math.round((deposits / totalMoved) * 100) : 0;
    const goalAmount = account.goalAmount ?? 0;
    const goalProgress = goalAmount > 0 ? Math.min(100, Math.round((account.currentBalance / goalAmount) * 100)) : 0;
    const goalRemaining = Math.max(0, goalAmount - account.currentBalance);
    const streakDays = getDepositStreak(kidTransactions, reference);
    const level = Math.max(1, Math.floor(account.currentBalance / 250) + 1);
    const xp = Math.min(100, Math.round(((account.currentBalance % 250) / 250) * 100));
    const nextMilestone = Math.ceil((account.currentBalance + 1) / 250) * 250;
    const base = {
      account,
      deposits,
      withdrawals,
      netSaved: deposits - withdrawals,
      monthlyDeposits,
      monthlyWithdrawals,
      savingsRate,
      moveCount: kidTransactions.length,
      depositCount,
      withdrawalCount,
      bestDeposit,
      streakDays,
      goalProgress,
      goalRemaining,
      nextMilestone,
      level,
      xp
    };
    const badges = getBadges(base);
    const mission = getMission(base);
    const tip = getTip(savingsRate, goalProgress);

    return { ...base, badges, mission, tip };
  });
}

export function buildAdminSummary(accounts: Account[], transactions: Transaction[]): AdminSummary {
  const depositTransactions = transactions.filter((transaction) => transaction.type === "Deposit");
  const withdrawalTransactions = transactions.filter((transaction) => transaction.type === "Withdrawal");
  const depositTotal = depositTransactions.reduce((total, transaction) => total + amountFor(transaction), 0);
  const withdrawalTotal = withdrawalTransactions.reduce((total, transaction) => total + amountFor(transaction), 0);

  return {
    totalBalance: accounts.reduce((total, account) => total + account.currentBalance, 0),
    depositTotal,
    withdrawalTotal,
    netMovement: depositTotal - withdrawalTotal,
    transactionCount: transactions.length,
    largestDeposit: depositTransactions.reduce<Transaction | null>(
      (best, transaction) => (!best || amountFor(transaction) > amountFor(best) ? transaction : best),
      null
    ),
    largestWithdrawal: withdrawalTransactions.reduce<Transaction | null>(
      (best, transaction) => (!best || amountFor(transaction) > amountFor(best) ? transaction : best),
      null
    )
  };
}

export function getTrailMomentum(data: LedgerPoint[]) {
  if (data.length < 2) return { basil: 0, osama: 0 };
  const last = data[data.length - 1];
  const previous = data[Math.max(0, data.length - 8)];

  return {
    basil: last.basilBalance - previous.basilBalance,
    osama: last.osamaBalance - previous.osamaBalance
  };
}
