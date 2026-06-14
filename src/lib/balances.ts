import { TransactionType, type Prisma } from "@prisma/client";

export async function recalculateAccountBalance(
  tx: Prisma.TransactionClient,
  accountId: string,
  options: { allowNegative?: boolean } = {}
) {
  const totals = await tx.transaction.groupBy({
    by: ["type"],
    where: { accountId },
    _sum: { amount: true }
  });

  const currentBalance = totals.reduce((total, row) => {
    const amount = Number(row._sum.amount ?? 0);
    return row.type === TransactionType.Deposit ? total + amount : total - amount;
  }, 0);

  if (currentBalance < 0 && !options.allowNegative) {
    throw new Error("This change would make the balance negative.");
  }

  await tx.account.update({
    where: { id: accountId },
    data: { currentBalance }
  });

  return currentBalance;
}
