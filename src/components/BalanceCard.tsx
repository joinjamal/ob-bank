"use client";

import { ChangeEvent, useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { ArrowDownCircle, ArrowUpCircle, Camera, Palette, Target, Trophy, X } from "lucide-react";
import { updateAccountGoal, updateAccountProfileStyle } from "@/app/actions";
import { Account } from "@/components/types";
import { useI18n } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";

type Props = {
  account: Account;
  animation?: { type: "Deposit" | "Withdrawal"; id: number; goalReached?: boolean } | null;
  showQuickActions?: boolean;
  onAvatarUpload?: (accountId: string, avatarUrl: string) => Promise<void>;
  onProfileStyleChange?: (accountId: string, profileColor: string, profilePattern: string) => void;
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
        context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
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
  onProfileStyleChange,
  onQuickAdd
}: Props) {
  const { t } = useI18n();
  const isBasil = account.name === "Basil";
  const panel = isBasil ? "bg-basil-soft" : "bg-osama-soft";
  const isDeposit = animation?.type === "Deposit";
  const isWithdrawal = animation?.type === "Withdrawal";
  const isGoalCelebration = Boolean(animation?.goalReached);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [savedProfileColor, setSavedProfileColor] = useState(account.profileColor || panel);
  const [savedProfilePattern, setSavedProfilePattern] = useState(account.profilePattern || "soft");
  const [savedGoalName, setSavedGoalName] = useState(account.goalName);
  const [savedGoalAmount, setSavedGoalAmount] = useState(account.goalAmount);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [goalNameInput, setGoalNameInput] = useState(account.goalName || "");
  const [goalAmountInput, setGoalAmountInput] = useState(account.goalAmount ? String(account.goalAmount) : "");

  useEffect(() => {
    setSavedProfileColor(account.profileColor || panel);
    setSavedProfilePattern(account.profilePattern || "soft");
    setSavedGoalName(account.goalName);
    setSavedGoalAmount(account.goalAmount);
    setGoalNameInput(account.goalName || "");
    setGoalAmountInput(account.goalAmount ? String(account.goalAmount) : "");
  }, [account.goalAmount, account.goalName, account.profileColor, account.profilePattern, panel]);

  const goalAmount = savedGoalAmount ?? 0;
  const progressPercentage = goalAmount > 0 ? Math.min(100, (account.currentBalance / goalAmount) * 100) : 0;
  const remaining = Math.max(0, goalAmount - account.currentBalance);
  const hasGoal = goalAmount > 0 && Boolean(savedGoalName);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !onAvatarUpload || !file.type.startsWith("image/")) return;

    setIsUploading(true);
    try {
      const result = await resizeImage(file);
      await onAvatarUpload(account.id, result);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  async function handleSaveGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(goalAmountInput);
    const nextGoalName = goalNameInput.trim() || null;
    const nextGoalAmount = Number.isFinite(amount) && amount > 0 ? amount : null;
    await updateAccountGoal(account.id, nextGoalName, nextGoalAmount);
    setSavedGoalName(nextGoalName);
    setSavedGoalAmount(nextGoalAmount);
    setShowGoalModal(false);
  }

  async function handleSaveProfileStyle(profileColor: string, profilePattern: string) {
    setSavedProfileColor(profileColor);
    setSavedProfilePattern(profilePattern);
    await updateAccountProfileStyle(account.id, profileColor, profilePattern);
    onProfileStyleChange?.(account.id, profileColor, profilePattern);
    setShowStyleModal(false);
  }

  const patternStyle = {
    ...getPatternStyle(savedProfileColor, savedProfilePattern),
    "--kid-theme-color": account.themeColor
  } as CSSProperties;

  return (
    <>
      <section className="surface-card relative max-w-full overflow-hidden">
        <div className="kid-color-surface relative overflow-hidden p-4 sm:p-5" style={patternStyle}>
          {animation && (
            <div key={`card-effect-${animation.id}`} className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
              {isDeposit && (
                <>
                  <span className="money-effect-coin money-effect-coin-a">+</span>
                  <span className="money-effect-coin money-effect-coin-b">+</span>
                  <span className="money-effect-coin money-effect-coin-c">+</span>
                  <span className="money-effect-star money-effect-star-a" />
                  <span className="money-effect-star money-effect-star-b" />
                </>
              )}
              {isWithdrawal && (
                <>
                  <span className="spend-effect-receipt spend-effect-receipt-a">-</span>
                  <span className="spend-effect-receipt spend-effect-receipt-b">-</span>
                  <span className="spend-effect-streak spend-effect-streak-a" />
                  <span className="spend-effect-streak spend-effect-streak-b" />
                </>
              )}
              {isGoalCelebration && (
                <div className="goal-effect">
                  <Trophy size={34} />
                  <span className="goal-effect-ring" />
                  <span className="goal-effect-spark goal-effect-spark-a" />
                  <span className="goal-effect-spark goal-effect-spark-b" />
                  <span className="goal-effect-spark goal-effect-spark-c" />
                </div>
              )}
            </div>
          )}
          <div className="relative grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-3 inline-flex max-w-full items-center gap-2 truncate rounded-full bg-white/80 px-3 py-1 text-sm font-extrabold">
                <Trophy size={15} style={{ color: account.themeColor }} />
                <span className="truncate">{t("balance.vault", { name: account.name })}</span>
              </div>
              <p className="text-sm font-bold text-ink/60">{t("balance.current")}</p>
              <p className="mt-1 break-words text-4xl font-black tracking-normal sm:text-6xl">
                {formatMoney(account.currentBalance)}
              </p>
            </div>

            <div className="relative h-16 w-16 shrink-0 sm:h-24 sm:w-24">
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
                className={`group relative h-14 w-14 overflow-hidden rounded-full border-4 border-white bg-white shadow-md transition hover:scale-105 disabled:cursor-default sm:h-20 sm:w-20 ${
                  isDeposit ? "avatar-deposit" : ""
                } ${isWithdrawal ? "avatar-withdrawal" : ""}`}
                aria-label={t("balance.vault", { name: account.name })}
              >
                <img src={account.avatarUrl} alt={`${account.name} avatar`} className="h-full w-full object-cover" />
                {onAvatarUpload && (
                  <span className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full bg-ink text-white opacity-95 shadow-sm transition group-hover:bg-mint">
                    <Camera size={14} />
                  </span>
                )}
              </button>
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
          </div>
        </div>

        <div className="relative min-w-0 space-y-4 p-4 sm:p-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="flex min-w-0 items-center gap-2 text-sm font-black text-ink/70">
                <Target size={16} className="shrink-0 text-mint" />
                <span className="min-w-0 truncate">{hasGoal ? savedGoalName : t("balance.chooseGoal")}</span>
              </p>
              <p className="mt-1 text-sm font-bold text-ink/50">
                {hasGoal ? t("balance.leftToGo", { amount: formatMoney(remaining) }) : t("balance.pickGoal")}
              </p>
            </div>
            {hasGoal && <span className="text-sm font-black text-ink/70">{formatMoney(goalAmount)}</span>}
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-mint transition-all duration-700"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          {hasGoal && progressPercentage >= 100 && (
            <p className="mt-2 rounded-[8px] bg-mint/15 px-3 py-2 text-sm font-black text-mint">
              {t("balance.goalReached")}
            </p>
          )}
          <button
            type="button"
            onClick={() => setShowGoalModal(true)}
            className="action-button action-muted mt-3 min-h-10 px-3 py-1"
          >
            {hasGoal ? t("balance.changeGoal") : t("balance.setGoal")}
          </button>
          <button
            type="button"
            onClick={() => setShowStyleModal(true)}
            className="action-button action-muted mt-3 min-h-10 px-3 py-1 sm:ml-2"
          >
            <Palette size={14} />
            {t("balance.cardStyle")}
          </button>

          {showQuickActions && onQuickAdd && (
            <div className="relative grid grid-cols-2 gap-3 border-t border-ink/5 pt-4">
              <button
                onClick={() => onQuickAdd(account.id, "Deposit")}
                className="action-button action-mint"
              >
                <ArrowUpCircle size={18} />
                {t("balance.add")}
              </button>
              <button
                onClick={() => onQuickAdd(account.id, "Withdrawal")}
                className="action-button action-coral"
              >
                <ArrowDownCircle size={18} />
                {t("balance.spend")}
              </button>
            </div>
          )}
          </div>
      </section>

      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-sm">
          <form onSubmit={handleSaveGoal} className="w-full max-w-sm rounded-[8px] bg-white p-5 shadow-lift">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black">{t("balance.savingGoal")}</h2>
              <button type="button" onClick={() => setShowGoalModal(false)} className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-ink">
                <X size={18} />
              </button>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-black text-ink/70">{t("balance.goalName")}</span>
              <input
                value={goalNameInput}
                onChange={(event) => setGoalNameInput(event.target.value)}
                placeholder={t("balance.goalPlaceholder")}
                className="h-12 w-full rounded-[8px] border-2 border-ink/10 px-3 font-bold outline-none transition focus:border-mint"
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-black text-ink/70">{t("balance.goalAmount")}</span>
              <input
                value={goalAmountInput}
                onChange={(event) => setGoalAmountInput(event.target.value)}
                inputMode="decimal"
                placeholder="150"
                className="h-12 w-full rounded-[8px] border-2 border-ink/10 px-3 font-bold outline-none transition focus:border-mint"
              />
            </label>
            <button className="mt-5 h-12 w-full rounded-[8px] bg-ink font-black text-white transition hover:-translate-y-0.5">
              {t("balance.saveGoal")}
            </button>
          </form>
        </div>
      )}

      {showStyleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[8px] bg-white p-5 shadow-lift">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black">{t("balance.cardStyle")}</h2>
              <button type="button" onClick={() => setShowStyleModal(false)} className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-ink">
                <X size={18} />
              </button>
            </div>
            <p className="mb-3 text-sm font-bold text-ink/55">
              {t("balance.cardStyleHelp", { name: account.name })}
            </p>
            <div className="grid grid-cols-5 gap-2">
              {profileColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSavedProfileColor(color)}
                  className={`h-11 rounded-[8px] border-2 ${savedProfileColor === color ? "border-ink" : "border-white"}`}
                  style={{ backgroundColor: color }}
                  aria-label={`Choose ${color}`}
                />
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {profilePatterns.map((pattern) => (
                <button
                  key={pattern.value}
                  type="button"
                  onClick={() => setSavedProfilePattern(pattern.value)}
                  className={`rounded-[8px] border-2 px-3 py-2 text-sm font-black capitalize ${
                    savedProfilePattern === pattern.value ? "border-ink bg-ink text-white" : "border-ink/10 bg-white"
                  }`}
                >
                  {t(pattern.labelKey)}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleSaveProfileStyle(savedProfileColor, savedProfilePattern)}
              className="mt-5 h-12 w-full rounded-[8px] bg-ink font-black text-white transition hover:-translate-y-0.5"
            >
              {t("balance.saveStyle")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const profileColors = ["#DCEBFF", "#ECE4FF", "#D9FBEA", "#FFF0BE", "#FFE3DD"];

const profilePatterns = [
  { value: "soft", labelKey: "balance.styleSoft" },
  { value: "dots", labelKey: "balance.styleDots" },
  { value: "stars", labelKey: "balance.styleStars" },
  { value: "stripes", labelKey: "balance.styleStripes" },
  { value: "grid", labelKey: "balance.styleGrid" }
];

function getPatternStyle(color: string, pattern: string): CSSProperties {
  const overlay = "rgba(255,255,255,0.52)";

  if (pattern === "dots") {
    return {
      backgroundColor: color,
      backgroundImage: `radial-gradient(circle, ${overlay} 2px, transparent 2px)`,
      backgroundSize: "18px 18px"
    };
  }

  if (pattern === "stars") {
    return {
      backgroundColor: color,
      backgroundImage: `radial-gradient(circle at 30% 30%, ${overlay} 0 2px, transparent 3px), radial-gradient(circle at 70% 70%, ${overlay} 0 2px, transparent 3px)`,
      backgroundSize: "28px 28px"
    };
  }

  if (pattern === "stripes") {
    return {
      backgroundColor: color,
      backgroundImage: `repeating-linear-gradient(135deg, transparent 0 12px, ${overlay} 12px 20px)`
    };
  }

  if (pattern === "grid") {
    return {
      backgroundColor: color,
      backgroundImage: `linear-gradient(${overlay} 1px, transparent 1px), linear-gradient(90deg, ${overlay} 1px, transparent 1px)`,
      backgroundSize: "22px 22px"
    };
  }

  return { backgroundColor: color };
}
