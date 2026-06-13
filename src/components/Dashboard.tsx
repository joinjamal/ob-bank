"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeDollarSign } from "lucide-react";
import { updateAccountAvatar } from "@/app/actions";
import ActivityFeed from "@/components/ActivityFeed";
import BalanceCard from "@/components/BalanceCard";
import TrendChart from "@/components/TrendChart";
import { Account, LedgerPoint, Transaction } from "@/components/types";

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ledger, setLedger] = useState<LedgerPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const sortedAccounts = useMemo(
    () =>
      [...accounts].sort((a, b) =>
        a.name === "Basil" ? -1 : b.name === "Basil" ? 1 : a.name.localeCompare(b.name)
      ),
    [accounts]
  );

  const loadData = useCallback(async () => {
    setError("");
    const [accountResponse, transactionResponse, ledgerResponse] = await Promise.all([
      fetch("/api/accounts", { cache: "no-store" }),
      fetch("/api/transactions", { cache: "no-store" }),
      fetch("/api/ledger", { cache: "no-store" })
    ]);

    if (!accountResponse.ok || !transactionResponse.ok || !ledgerResponse.ok) {
      throw new Error("Could not load OB Bank data.");
    }

    setAccounts(await accountResponse.json());
    setTransactions(await transactionResponse.json());
    setLedger(await ledgerResponse.json());
  }, []);

  useEffect(() => {
    loadData()
      .catch((err) => setError(err instanceof Error ? err.message : "Something went wrong."))
      .finally(() => setIsLoading(false));
  }, [loadData]);

  async function handleAvatarUpload(accountId: string, avatarUrl: string) {
    await updateAccountAvatar(accountId, avatarUrl);
    await loadData();
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-sm font-black shadow-sm">
            <BadgeDollarSign size={17} className="text-mint" />
            Digital allowance bank
          </div>
          <h1 className="text-4xl font-black tracking-normal text-ink sm:text-6xl">OB Bank</h1>
          <p className="mt-2 max-w-2xl text-base font-bold text-ink/65 sm:text-lg">
            Basil and Osama&apos;s bright little money dashboard.
          </p>
        </header>

        {error && <p className="mb-5 rounded-[8px] bg-coral/10 p-4 font-bold text-coral">{error}</p>}

        {isLoading ? (
          <div className="grid min-h-[50vh] place-items-center rounded-[8px] bg-white/80 p-8 text-xl font-black shadow-lift">
            Loading OB Bank...
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              {sortedAccounts.map((account) => (
                <BalanceCard key={account.id} account={account} onAvatarUpload={handleAvatarUpload} />
              ))}
            </div>
            <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
              <TrendChart data={ledger} />
              <ActivityFeed transactions={transactions} compact />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
