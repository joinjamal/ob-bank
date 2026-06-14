import { buildWealthTrailFromTransactions } from "@/lib/ledger";
import { prisma } from "@/lib/prisma";
import { serializeAccount, serializeTransaction } from "@/lib/serializers";

export async function getAccounts() {
  const accounts = await prisma.account.findMany({ orderBy: { name: "asc" } });
  return accounts.map(serializeAccount);
}

export async function getKidLoginAccounts() {
  const accounts = await prisma.account.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      themeColor: true,
      profileColor: true,
      profilePattern: true
    }
  });

  return accounts.map((account) => ({
    ...account,
    avatarUrl: `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(account.name)}`
  }));
}

export async function getTransactions(limit?: number) {
  const transactions = await prisma.transaction.findMany({
    include: {
      account: {
        select: {
          id: true,
          name: true,
          themeColor: true
        }
      }
    },
    orderBy: { date: "desc" },
    take: limit
  });

  return transactions.map(serializeTransaction);
}

export async function getKidTransactions(accountId: string, limit = 80) {
  const transactions = await prisma.transaction.findMany({
    where: { accountId },
    include: {
      account: {
        select: {
          id: true,
          name: true,
          themeColor: true
        }
      }
    },
    orderBy: { date: "desc" },
    take: limit
  });

  return transactions.map(serializeTransaction);
}

export async function getKidLedger(accountId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { accountId },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      date: true,
      amount: true,
      type: true
    }
  });
  let balance = 0;
  const daily = new Map<string, { id: string; date: string; balance: number }>();

  for (const transaction of transactions) {
    balance += transaction.type === "Deposit" ? Number(transaction.amount) : -Number(transaction.amount);
    const id = transaction.date.toISOString().slice(0, 10);
    daily.set(id, {
      id,
      date: transaction.date.toISOString(),
      balance: Number(balance.toFixed(2))
    });
  }

  return Array.from(daily.values());
}

export async function getKidDashboardData(accountId: string) {
  const account = await prisma.account.findUnique({ where: { id: accountId } });

  if (!account) {
    throw new Error("Kid account not found.");
  }

  const [transactions, ledger] = await Promise.all([
    getKidTransactions(accountId),
    getKidLedger(accountId)
  ]);

  return {
    account: serializeAccount(account),
    transactions,
    ledger
  };
}

export async function getDashboardData() {
  const [accounts, transactions, ledger] = await Promise.all([
    getAccounts(),
    getTransactions(80),
    buildWealthTrailFromTransactions()
  ]);

  return { accounts, transactions, ledger };
}

export async function getAdminData() {
  const [accounts, transactions, ledger] = await Promise.all([
    getAccounts(),
    getTransactions(),
    buildWealthTrailFromTransactions()
  ]);

  return { accounts, transactions, ledger };
}
