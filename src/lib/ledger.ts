import { prisma } from "@/lib/prisma";

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
