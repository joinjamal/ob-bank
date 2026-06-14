import type { Account, LedgerPoint, Transaction } from "@/components/types";

export type TransactionInput = {
  accountId: string;
  type: "Deposit" | "Withdrawal";
  amount: number;
  reason?: string;
};

export function signedAmount(type: "Deposit" | "Withdrawal", amount: number) {
  return type === "Deposit" ? amount : -amount;
}

export function createOptimisticTransaction(
  payload: TransactionInput,
  account: Account,
  id = `optimistic-${Date.now()}`
): Transaction {
  return {
    id,
    accountId: account.id,
    accountName: account.name,
    date: new Date().toISOString(),
    type: payload.type,
    amount: payload.amount,
    reason: payload.reason?.trim() || null
  };
}

export function applyAccountDelta(accounts: Account[], accountId: string, delta: number) {
  return accounts.map((account) =>
    account.id === accountId
      ? { ...account, currentBalance: Number((account.currentBalance + delta).toFixed(2)) }
      : account
  );
}

export function applyTodayLedgerDelta(
  ledger: LedgerPoint[],
  accountName: string,
  delta: number,
  accountsAfterChange: Account[]
) {
  const key = accountName === "Basil" ? "basilBalance" : "osamaBalance";
  const todayId = new Date().toISOString().slice(0, 10);
  const todayIndex = ledger.findIndex((point) => point.date.slice(0, 10) === todayId);

  if (todayIndex >= 0) {
    return ledger.map((point, index) =>
      index === todayIndex ? { ...point, [key]: Number((point[key] + delta).toFixed(2)) } : point
    );
  }

  const basil = accountsAfterChange.find((account) => account.name === "Basil");
  const osama = accountsAfterChange.find((account) => account.name === "Osama");

  return [
    ...ledger,
    {
      id: todayId,
      date: new Date().toISOString(),
      basilBalance: basil?.currentBalance ?? 0,
      osamaBalance: osama?.currentBalance ?? 0
    }
  ];
}

export function transactionDelta(transaction: Transaction) {
  return signedAmount(transaction.type, transaction.amount);
}

export function replacementDelta(before: Transaction, after: Transaction) {
  return transactionDelta(after) - transactionDelta(before);
}
