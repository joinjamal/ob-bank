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

export type KidLoginAccount = {
  id: string;
  name: string;
  avatarUrl: string;
  themeColor: string;
  profileColor: string;
  profilePattern: string;
};

export type Transaction = {
  id: string;
  accountId: string;
  accountName: string;
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

export type GameScore = {
  id: string;
  accountId: string;
  accountName: string;
  mode: string;
  score: number;
  coins: number;
  createdAt: string;
};
