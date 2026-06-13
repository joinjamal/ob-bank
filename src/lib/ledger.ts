import { prisma } from "@/lib/prisma";
import { toMoney } from "@/lib/money";

export async function snapshotLedger(date = new Date()) {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const [basil, osama] = await Promise.all([
    prisma.account.findUnique({ where: { name: "Basil" } }),
    prisma.account.findUnique({ where: { name: "Osama" } })
  ]);

  return prisma.historicalLedger.upsert({
    where: { date: day },
    update: {
      basilBalance: basil?.currentBalance ?? 0,
      osamaBalance: osama?.currentBalance ?? 0
    },
    create: {
      date: day,
      basilBalance: basil?.currentBalance ?? 0,
      osamaBalance: osama?.currentBalance ?? 0
    }
  });
}

export async function buildWealthTrailFromTransactions() {
  const transactions = await prisma.transaction.findMany({
    include: { account: { select: { name: true } } },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }]
  });

  let basilBalance = 0;
  let osamaBalance = 0;
  const dailyBalances = new Map<string, { date: Date; basilBalance: number; osamaBalance: number }>();

  for (const transaction of transactions) {
    const amount = toMoney(transaction.amount);
    const signedAmount = transaction.type === "Deposit" ? amount : -amount;
    const kidName = transaction.account.name.toLowerCase();

    if (kidName === "basil") {
      basilBalance += signedAmount;
    }

    if (kidName === "osama") {
      osamaBalance += signedAmount;
    }

    const day = new Date(
      Date.UTC(transaction.date.getUTCFullYear(), transaction.date.getUTCMonth(), transaction.date.getUTCDate(), 12)
    );
    const key = day.toISOString().slice(0, 10);

    dailyBalances.set(key, {
      date: day,
      basilBalance: Number(basilBalance.toFixed(2)),
      osamaBalance: Number(osamaBalance.toFixed(2))
    });
  }

  if (dailyBalances.size === 0) {
    const [basil, osama] = await Promise.all([
      prisma.account.findUnique({ where: { name: "Basil" } }),
      prisma.account.findUnique({ where: { name: "Osama" } })
    ]);
    const today = new Date();
    const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12));

    return [
      {
        id: day.toISOString().slice(0, 10),
        date: day.toISOString(),
        basilBalance: basil ? toMoney(basil.currentBalance) : 0,
        osamaBalance: osama ? toMoney(osama.currentBalance) : 0
      }
    ];
  }

  return Array.from(dailyBalances.entries()).map(([id, point]) => ({
    id,
    date: point.date.toISOString(),
    basilBalance: point.basilBalance,
    osamaBalance: point.osamaBalance
  }));
}
