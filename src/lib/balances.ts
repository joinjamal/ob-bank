import { TransactionType, type Prisma } from "@prisma/client";

export async function recalculateAccountBalance(
  tx: Prisma.TransactionClient,
  accountId: string,
  options: { allowNegative?: boolean } = {}
) {
  const transactions = await tx.transaction.findMany({
    where: { accountId },
    select: { amount: true, type: true }
  });

  const currentBalance = transactions.reduce((total, transaction) => {
    const amount = Number(transaction.amount);
    return transaction.type === TransactionType.Deposit ? total + amount : total - amount;
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
