"use client";

import Image from "next/image";
import { ArrowDownCircle, ArrowUpCircle, Sparkles } from "lucide-react";
import { Account } from "@/components/types";
import { formatMoney } from "@/lib/money";

type Props = {
  account: Account;
  animation: { type: "Deposit" | "Withdrawal"; id: number } | null;
  onQuickAdd: (accountId: string, type: "Deposit" | "Withdrawal") => void;
};

export default function BalanceCard({ account, animation, onQuickAdd }: Props) {
  const isBasil = account.name === "Basil";
  const panel = isBasil ? "bg-basil-soft" : "bg-osama-soft";
  const isDeposit = animation?.type === "Deposit";
  const isWithdrawal = animation?.type === "Withdrawal";

  return (
    <section className={`relative overflow-hidden rounded-[8px] ${panel} p-5 shadow-lift`}>
      <div
        className="absolute -right-12 -top-14 h-40 w-40 rounded-full opacity-20"
        style={{ backgroundColor: account.themeColor }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-sm font-extrabold">
            <Sparkles size={15} style={{ color: account.themeColor }} />
            {account.name}&apos;s vault
          </div>
          <p className="text-sm font-bold text-ink/60">Current balance</p>
          <p className="mt-1 text-4xl font-black tracking-normal sm:text-5xl">
            {formatMoney(account.currentBalance)}
          </p>
        </div>
        <div className="relative h-24 w-24 shrink-0">
          {animation && (
            <div key={`burst-${animation.id}`} className="pointer-events-none absolute inset-0 z-10">
              {isDeposit ? (
                <>
                  <span className="avatar-coin avatar-coin-one">+</span>
                  <span className="avatar-coin avatar-coin-two">+</span>
                  <span className="avatar-spark avatar-spark-one" />
                  <span className="avatar-spark avatar-spark-two" />
                </>
              ) : (
                <>
                  <span className="avatar-receipt avatar-receipt-one">-</span>
                  <span className="avatar-receipt avatar-receipt-two">-</span>
                  <span className="avatar-puff avatar-puff-one" />
                  <span className="avatar-puff avatar-puff-two" />
                </>
              )}
            </div>
          )}
          <div
            key={animation?.id ?? "idle"}
            className={`h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-white shadow-md ${
              isDeposit ? "avatar-deposit" : ""
            } ${isWithdrawal ? "avatar-withdrawal" : ""}`}
          >
            <Image src={account.avatarUrl} alt={`${account.name} avatar`} width={80} height={80} />
          </div>
        </div>
      </div>
      <div className="relative mt-5 grid grid-cols-2 gap-3">
        <button
          onClick={() => onQuickAdd(account.id, "Deposit")}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-mint px-3 py-2 font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <ArrowUpCircle size={18} />
          Add
        </button>
        <button
          onClick={() => onQuickAdd(account.id, "Withdrawal")}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-coral px-3 py-2 font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <ArrowDownCircle size={18} />
          Remove
        </button>
      </div>
    </section>
  );
}
