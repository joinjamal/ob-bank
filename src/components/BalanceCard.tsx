"use client";

import { ChangeEvent, useRef, useState, FormEvent } from "react";
import { ArrowDownCircle, ArrowUpCircle, Camera, Target, X } from "lucide-react";
import { Account } from "@/components/types";
import { formatMoney } from "@/lib/money";
import { updateAccountGoal } from "@/app/actions";

type Props = {
  account: Account;
  animation?: { type: "Deposit" | "Withdrawal"; id: number } | null;
  showQuickActions?: boolean;
  onAvatarUpload?: (accountId: string, avatarUrl: string) => Promise<void>;
  onQuickAdd?: (accountId: string, type: "Deposit" | "Withdrawal") => void;
};

function resizeImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.onload = () => {
      image.onerror = () => reject(new Error("Could not load that image."));
      image.onload = () => {
        const size = 360;
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Image resizing is not available."));
          return;
        }

        canvas.width = size;
        canvas.height = size;

        const scale = Math.max(size / image.width, size / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        const x = (size - width) / 2;
        const y = (size - height) / 2;

        context.drawImage(image, x, y, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = String(reader.result ?? "");
    };
    reader.readAsDataURL(file);
  });
}

export default function BalanceCard({
  account,
  animation = null,
  showQuickActions = false,
  onAvatarUpload,
  onQuickAdd
}: Props) {
  const isBasil = account.name === "Basil";
  const isDeposit = animation?.type === "Deposit";
  const isWithdrawal = animation?.type === "Withdrawal";
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalNameInput, setGoalNameInput] = useState(account.goalName || "");
  const [goalAmountInput, setGoalAmountInput] = useState(account.goalAmount ? String(account.goalAmount) : "");

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !onAvatarUpload) return;

    if (!file.type.startsWith("image/")) return;

    setIsUploading(true);
    try {
      const result = await resizeImage(file);
      await onAvatarUpload(account.id, result);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  async function handleSaveGoal(e: FormEvent) {
    e.preventDefault();
    const amount = Number(goalAmountInput);
    if (!goalNameInput.trim() || !amount || amount <= 0) return;
    
    await updateAccountGoal(account.id, goalNameInput.trim(), amount);
    setShowGoalModal(false);
  }

  const goalAmount = account.goalAmount ? Number(account.goalAmount) : 0;
  const progressPercentage = goalAmount > 0 ? Math.min(100, (account.currentBalance / goalAmount) * 100) : 0;
  const hasGoal = goalAmount > 0;

  return (
    <>
      <section className="relative overflow-hidden rounded-xl border-4 border-arcade-dark bg-white p-5 shadow-retro transition-transform hover:-translate-y-1">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,1) 1px, transparent 1px)", backgroundSize: "100% 4px" }} />
        
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-4 inline-flex items-center gap-2 rounded bg-arcade-dark px-3 py-1 font-arcade text-xs text-white uppercase tracking-widest shadow-sm">
              PLAYER {isBasil ? "1" : "2"} : {account.name}
            </div>
            
            <p className="font-arcade text-[10px] text-arcade-dark/50 uppercase tracking-widest">Score / Balance</p>
            <p className="mt-2 font-arcade text-3xl sm:text-4xl" style={{ color: account.themeColor }}>
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
                  </>
                ) : (
                  <>
                    <span className="avatar-receipt avatar-receipt-one">-</span>
                    <span className="avatar-receipt avatar-receipt-two">-</span>
                  </>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={!onAvatarUpload || isUploading}
              className={`group relative h-20 w-20 overflow-hidden rounded-md border-4 border-arcade-dark bg-arcade-bg shadow-sm transition hover:scale-105 disabled:cursor-default ${
                isDeposit ? "avatar-deposit" : ""
              } ${isWithdrawal ? "avatar-withdrawal" : ""}`}
            >
              <img src={account.avatarUrl} alt={`${account.name} avatar`} className="h-full w-full object-cover pixelated" />
              {onAvatarUpload && (
                <span className="absolute bottom-1 right-1 grid h-6 w-6 place-items-center rounded bg-arcade-dark text-white opacity-95 shadow-sm transition group-hover:bg-arcade-green group-hover:text-black">
                  <Camera size={14} />
                </span>
              )}
            </button>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
        </div>

        <div className="relative mt-6 rounded-lg border-2 border-arcade-dark bg-gray-100 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-arcade text-[10px] uppercase text-arcade-dark flex items-center gap-2">
              <Target size={12} />
              {hasGoal ? account.goalName : "NO MISSION"}
            </span>
            {hasGoal && (
              <span className="font-arcade text-[10px] text-arcade-dark/60">
                {formatMoney(goalAmount)}
              </span>
            )}
          </div>
          
          <div className="relative h-6 w-full overflow-hidden rounded border-2 border-arcade-dark bg-white">
            <div 
              className="absolute inset-y-0 left-0 bg-arcade-yellow transition-all duration-1000 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
            {progressPercentage >= 100 && (
              <div className="absolute inset-0 flex items-center justify-center font-arcade text-[10px] text-arcade-dark">
                MISSION COMPLETE!
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setShowGoalModal(true)}
            className="mt-3 text-[10px] font-arcade uppercase text-arcade-dark/50 hover:text-arcade-dark transition underline decoration-dotted"
          >
            {hasGoal ? "CHANGE MISSION" : "SET A MISSION"}
          </button>
        </div>

        {showQuickActions && onQuickAdd && (
          <div className="relative mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={() => onQuickAdd(account.id, "Deposit")}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded border-b-4 border-black/20 bg-arcade-green font-arcade text-xs text-arcade-dark shadow-sm transition hover:-translate-y-0.5 active:translate-y-1 active:border-b-0 uppercase"
            >
              <ArrowUpCircle size={16} />
              ADD
            </button>
            <button
              onClick={() => onQuickAdd(account.id, "Withdrawal")}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded border-b-4 border-black/20 bg-arcade-pink font-arcade text-xs text-white shadow-sm transition hover:-translate-y-0.5 active:translate-y-1 active:border-b-0 uppercase"
            >
              <ArrowDownCircle size={16} />
              SPEND
            </button>
          </div>
        )}
      </section>

      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-arcade-dark/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border-4 border-white bg-arcade-bg font-arcade shadow-retro">
            <header className="flex items-center justify-between border-b-4 border-white p-4">
              <h2 className="text-sm uppercase tracking-widest text-white">SET MISSION</h2>
              <button onClick={() => setShowGoalModal(false)} className="text-white hover:text-arcade-pink">
                <X size={18} />
              </button>
            </header>
            <form onSubmit={handleSaveGoal} className="p-5 space-y-4">
              <div>
                <label className="mb-2 block text-xs text-white">Target Name</label>
                <input
                  type="text"
                  required
                  value={goalNameInput}
                  onChange={(e) => setGoalNameInput(e.target.value)}
                  className="w-full rounded border-2 border-white/20 bg-arcade-dark p-3 text-xs text-white outline-none focus:border-arcade-yellow"
                  placeholder="e.g. New Bike"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs text-white">Target Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/50">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={goalAmountInput}
                    onChange={(e) => setGoalAmountInput(e.target.value)}
                    className="w-full rounded border-2 border-white/20 bg-arcade-dark py-3 pl-8 pr-3 text-xs text-white outline-none focus:border-arcade-yellow"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded border-b-4 border-black/20 bg-arcade-yellow py-3 text-xs uppercase text-arcade-dark transition active:translate-y-1 active:border-b-0"
              >
                SAVE MISSION
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}