export type Account = {
  id: string;
  name: string;
  avatarUrl: string;
  currentBalance: number;
  themeColor: string;
};

export type Transaction = {
  id: string;
  accountId: string;
  accountName: string;
  accountAvatarUrl: string;
  accountThemeColor: string;
  date: string;
  type: "Deposit" | "Withdrawal";
  amount: number;
  reason: string | null;
};

export type LedgerPoint = {
  id: string;
  date: string;
  basilBalance: number;
  osamaBalance: number;
};
