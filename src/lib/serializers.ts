import type { Account, HistoricalLedger, Transaction } from "@prisma/client";
import { toMoney } from "@/lib/money";

export function serializeAccount(account: Account) {
  return {
    id: account.id,
    name: account.name,
    avatarUrl: account.avatarUrl,
    currentBalance: toMoney(account.currentBalance),
    themeColor: account.themeColor,
    profileColor: account.profileColor,
    profilePattern: account.profilePattern,
    goalName: account.goalName,
    goalAmount: account.goalAmount ? toMoney(account.goalAmount) : null
  };
}

export function serializeTransaction(
  transaction: Transaction & {
    account: Pick<Account, "id" | "name" | "avatarUrl" | "themeColor">;
  }
) {
  return {
    id: transaction.id,
    accountId: transaction.accountId,
    accountName: transaction.account.name,
    accountAvatarUrl: transaction.account.avatarUrl,
    accountThemeColor: transaction.account.themeColor,
    date: transaction.date.toISOString(),
    type: transaction.type,
    amount: toMoney(transaction.amount),
    reason: transaction.reason
  };
}

export function serializeLedger(row: HistoricalLedger) {
  return {
    id: row.id,
    date: row.date.toISOString(),
    basilBalance: toMoney(row.basilBalance),
    osamaBalance: toMoney(row.osamaBalance)
  };
}
