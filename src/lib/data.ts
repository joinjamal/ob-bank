import { buildWealthTrailFromTransactions } from "@/lib/ledger";
import { runDueAllowances, serializeRecurringAllowance } from "@/lib/allowances";
import { prisma } from "@/lib/prisma";
import { serializeAccount, serializeTransaction } from "@/lib/serializers";

export async function getAccounts() {
  const accounts = await prisma.account.findMany({ orderBy: { name: "asc" } });
  return accounts.map(serializeAccount);
}

export async function getFamilies() {
  const families = await prisma.family.findMany({
    include: {
      parents: { orderBy: { name: "asc" } },
      accounts: { orderBy: { name: "asc" } }
    },
    orderBy: { name: "asc" }
  });

  return families.map((family) => ({
    id: family.id,
    name: family.name,
    parents: family.parents.map((parent) => ({
      id: parent.id,
      familyId: parent.familyId,
      name: parent.name,
      email: parent.email
    })),
    accounts: family.accounts.map(serializeAccount)
  }));
}

export async function getKidLoginAccounts() {
  const accounts = await prisma.account.findMany({ orderBy: { name: "asc" } });
  return accounts.map(serializeAccount);
}

export async function getFamilyKidLoginAccounts(familyId: string) {
  const accounts = await prisma.account.findMany({
    where: { familyId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      themeColor: true,
      profileColor: true,
      profilePattern: true
    }
  });
  return accounts;
}

export async function getFamilyName(familyId: string) {
  const family = await prisma.family.findUnique({
    where: { id: familyId },
    select: { name: true }
  });
  return family?.name ?? "your family";
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

export async function getFamilyTransactions(familyId: string, limit?: number) {
  const transactions = await prisma.transaction.findMany({
    where: { account: { familyId } },
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

  if (account.familyId) {
    await runDueAllowances(account.familyId);
  }

  const refreshedAccount = await prisma.account.findUnique({ where: { id: accountId } });

  const [transactions, ledger] = await Promise.all([
    getKidTransactions(accountId),
    getKidLedger(accountId)
  ]);

  return {
    account: serializeAccount(refreshedAccount ?? account),
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
  const [accounts, transactions, ledger, families] = await Promise.all([
    getAccounts(),
    getTransactions(),
    buildWealthTrailFromTransactions(),
    getFamilies()
  ]);

  return { accounts, transactions, ledger, families };
}

export async function getParentData(parentId: string) {
  const parent = await prisma.parent.findUnique({
    where: { id: parentId },
    include: { family: true }
  });

  if (!parent) {
    throw new Error("Parent account not found.");
  }

  await runDueAllowances(parent.familyId);

  const [accounts, transactions, allowances] = await Promise.all([
    prisma.account.findMany({ where: { familyId: parent.familyId }, orderBy: { name: "asc" } }),
    getFamilyTransactions(parent.familyId),
    prisma.recurringAllowance.findMany({
      where: { account: { familyId: parent.familyId } },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            familyId: true
          }
        }
      },
      orderBy: [{ active: "desc" }, { nextRunAt: "asc" }]
    })
  ]);

  return {
    parent: {
      id: parent.id,
      name: parent.name,
      email: parent.email,
      familyId: parent.familyId,
      familyName: parent.family.name
    },
    accounts: accounts.map(serializeAccount),
    transactions,
    allowances: allowances.map(serializeRecurringAllowance),
    ledger: []
  };
}
