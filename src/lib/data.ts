import { buildWealthTrailFromTransactions } from "@/lib/ledger";
import { prisma } from "@/lib/prisma";
import { serializeAccount, serializeTransaction } from "@/lib/serializers";

export async function getAccounts() {
  const accounts = await prisma.account.findMany({ orderBy: { name: "asc" } });
  return accounts.map(serializeAccount);
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
