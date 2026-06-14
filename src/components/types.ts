export type Account = {
  id: string;
  name: string;
  avatarUrl: string;
  currentBalance: number;
  themeColor: string;
  profileColor: string;
  profilePattern: string;
  goalName: string | null;
  goalAmount: number | null;
};

export type KidPickerAccount = Pick<Account, "id" | "name" | "avatarUrl" | "themeColor" | "profileColor" | "profilePattern">;

export type Transaction = {
  id: string;
  accountId: string;
  accountName: string;
  date: string;
  type: "Deposit" | "Withdrawal";
  amount: number;
  reason: string | null;
};

export type RecurringAllowance = {
  id: string;
  accountId: string;
  accountName: string;
  frequency: "Daily" | "Weekly" | "Monthly";
  amount: number;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  nextRunAt: string;
  active: boolean;
};

export type LedgerPoint = {
  id: string;
  date: string;
  basilBalance: number;
  osamaBalance: number;
};
