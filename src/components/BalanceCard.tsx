"use client";

import { ChangeEvent, useRef, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Camera, Sparkles } from "lucide-react";
import { Account } from "@/components/types";
import { formatMoney } from "@/lib/money";

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
  const panel = isBasil ? "bg-basil-soft" : "bg-osama-soft";
  const isDeposit = animation?.type === "Deposit";
  const isWithdrawal = animation?.type === "Withdrawal";
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={!onAvatarUpload || isUploading}
            className={`group relative h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-white shadow-md transition hover:scale-105 disabled:cursor-default ${
              isDeposit ? "avatar-deposit" : ""
            } ${isWithdrawal ? "avatar-withdrawal" : ""}`}
            aria-label={`Change ${account.name}'s photo`}
          >
            <img src={account.avatarUrl} alt={`${account.name} avatar`} className="h-full w-full object-cover" />
            {onAvatarUpload && (
              <span className="absolute bottom-5 right-4 grid h-7 w-7 place-items-center rounded-full bg-ink text-white opacity-95 shadow-sm transition group-hover:bg-mint">
                <Camera size={14} />
              </span>
            )}
          </button>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      {showQuickActions && onQuickAdd && (
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
      )}
    </section>
  );
}
