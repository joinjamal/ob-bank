"use client";

import { useCallback, useMemo, useRef, useState, type CSSProperties } from "react";
import { BadgeDollarSign, Check, KeyRound, LockKeyhole, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { updateAccountAvatar } from "@/app/actions";
import ActivityFeed from "@/components/ActivityFeed";
import BalanceCard from "@/components/BalanceCard";
import KidPinSettings from "@/components/KidPinSettings";
import KidProgressPanel from "@/components/KidProgressPanel";
import KidTransactionModal from "@/components/KidTransactionModal";
import KidWealthTrail from "@/components/KidWealthTrail";
import LanguageToggle from "@/components/LanguageToggle";
import SessionLoadingOverlay from "@/components/SessionLoadingOverlay";
import StandardCalculator from "@/components/StandardCalculator";
import ThemeToggle from "@/components/ThemeToggle";
import ToolFrame from "@/components/ToolFrame";
import type { Account, KidPickerAccount, Transaction } from "@/components/types";
import { useI18n } from "@/lib/i18n";
import {
  applyAccountDelta,
  createOptimisticTransaction,
  signedAmount
} from "@/lib/optimisticMoney";
import { playTransactionSound, playVaultErrorSound, playVaultUnlockSound } from "@/lib/sounds";

type KidLedgerPoint = {
  id: string;
  date: string;
  balance: number;
};

type KidData = {
  account: Account;
  transactions: Transaction[];
  ledger: KidLedgerPoint[];
};

type MoneyAnimation = {
  accountId: string;
  type: "Deposit" | "Withdrawal";
  id: number;
} | null;

const minimumVaultAnimationMs = 350;

export default function KidPortal({
  kids,
  familyName,
  initialKidData = null
}: {
  kids: KidPickerAccount[];
  familyName: string;
  initialKidData?: KidData | null;
}) {
  const { t } = useI18n();
  const [selectedKidId, setSelectedKidId] = useState(kids[0]?.id ?? "");
  const [pin, setPin] = useState("");
  const [rememberKid, setRememberKid] = useState(true);
  const [kidData, setKidData] = useState<KidData | null>(initialKidData);
  const [activeMove, setActiveMove] = useState<"Deposit" | "Withdrawal" | null>(null);
  const [moneyAnimation, setMoneyAnimation] = useState<MoneyAnimation>(null);
  const [message, setMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const animationTimer = useRef<number | null>(null);

  const selectedKid = useMemo(
    () => kids.find((kid) => kid.id === selectedKidId) ?? kids[0],
    [kids, selectedKidId]
  );

  const loadKidDetails = useCallback(async (accountId: string) => {
    setIsLoadingDetails(true);
    try {
      const response = await fetch(`/api/kids/dashboard?accountId=${encodeURIComponent(accountId)}`, {
        cache: "no-store"
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.message ?? "Could not load activity.");
      }

      setKidData((current) => (current?.account.id === accountId ? body : current));
    } catch {
      // Keep the vault open even if the chart/activity refresh is slow.
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  async function handleLogin() {
    setMessage("");

    if (!selectedKid || !/^\d{4,8}$/.test(pin)) {
      setMessage(t("kid.choose"));
      return;
    }

    setIsLoggingIn(true);

    try {
      const [response] = await Promise.all([
        fetch("/api/kids/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountId: selectedKid.id, pin, remember: rememberKid })
        }),
        new Promise((resolve) => window.setTimeout(resolve, minimumVaultAnimationMs))
      ]);
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.message ?? "Could not open your profile.");
      }

      playVaultUnlockSound();
      setKidData(body);
      setPin("");
      void loadKidDetails(body.account.id);
    } catch (error) {
      setKidData(null);
      playVaultErrorSound();
      setMessage(error instanceof Error ? error.message : "Could not open your profile.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleAvatarUpload(accountId: string, avatarUrl: string) {
    await updateAccountAvatar(accountId, avatarUrl);
    setKidData((current) =>
      current && current.account.id === accountId
        ? { ...current, account: { ...current.account, avatarUrl } }
        : current
    );
  }

  function handleProfileStyleChange(accountId: string, profileColor: string, profilePattern: string) {
    setKidData((current) =>
      current && current.account.id === accountId
        ? { ...current, account: { ...current.account, profileColor, profilePattern } }
        : current
    );
  }

  function triggerMoneyAnimation(accountId: string, type: "Deposit" | "Withdrawal") {
    playTransactionSound(type);

    if (animationTimer.current) {
      window.clearTimeout(animationTimer.current);
    }

    setMoneyAnimation({ accountId, type, id: Date.now() });
    animationTimer.current = window.setTimeout(() => setMoneyAnimation(null), 1100);
  }

  async function saveKidTransaction(payload: {
    accountId: string;
    type: "Deposit" | "Withdrawal";
    amount: number;
    reason: string;
  }) {
    if (!kidData) return;

    const optimisticId = `kid-${Date.now()}`;
    const optimisticTransaction = createOptimisticTransaction(payload, kidData.account, optimisticId);
    const delta = signedAmount(payload.type, payload.amount);
    const previous = kidData;
    const nextAccount = applyAccountDelta([kidData.account], payload.accountId, delta)[0];

    setKidData({
      ...kidData,
      account: nextAccount,
      transactions: [optimisticTransaction, ...kidData.transactions].slice(0, 80),
      ledger: bumpKidLedger(kidData.ledger, delta, nextAccount.currentBalance)
    });
    triggerMoneyAnimation(payload.accountId, payload.type);

    fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.message ?? "Could not save the transaction.");
        if (body?.transaction) {
          setKidData((current) =>
            current
              ? {
                  ...current,
                  transactions: current.transactions.map((transaction) =>
                    transaction.id === optimisticId ? body.transaction : transaction
                  )
                }
              : current
          );
        }
      })
      .catch((error) => {
        setKidData(previous);
        setMessage(error instanceof Error ? error.message : "Could not save the transaction.");
      });
  }

  if (!kidData) {
    return (
      <main className="app-shell">
        <div className="app-container max-w-5xl">
          <header className="app-header">
            <div>
              <div className="eyebrow-pill mb-3">
                <BadgeDollarSign size={17} className="text-mint" />
                {t("kid.loginBadge")}
              </div>
              <h1 className="page-title">{t("kid.chooseVault")}</h1>
              <p className="page-subtitle">
                {familyName}: {t("kid.choose")}
              </p>
            </div>
            <div className="app-actions">
              <Link
                href="/parent"
                className="action-button action-quiet"
              >
                <UserRound size={17} className="text-mint" />
                {t("kid.parent")}
              </Link>
              <LanguageToggle compact />
              <ThemeToggle compact />
            </div>
          </header>

          <section className="kid-entry-panel">
            {kids.length === 0 ? (
              <div className="rounded-[8px] bg-mint/10 p-5">
                <h2 className="text-2xl font-black text-ink">{t("kid.emptyTitle")}</h2>
                <p className="mt-2 font-bold text-ink/60">
                  {t("kid.emptyBody")}
                </p>
                <Link
                  href="/parent"
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-[8px] bg-mint px-4 font-black text-white"
                >
                  {t("kid.emptyCta")}
                </Link>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
                <div className="grid gap-3 sm:grid-cols-2">
                  {kids.map((kid) => (
                    <button
                      key={kid.id}
                      type="button"
                      onClick={() => setSelectedKidId(kid.id)}
                      className={`kid-color-surface group min-h-56 rounded-[8px] border-2 p-5 text-left transition hover:-translate-y-1 ${
                        selectedKidId === kid.id ? "border-mint shadow-lift" : "border-white/90 shadow-sm"
                      }`}
                      style={{ backgroundColor: kid.profileColor, "--kid-theme-color": kid.themeColor } as CSSProperties}
                    >
                      <div className="flex h-full flex-col justify-between gap-5">
                        <img
                          src={kid.avatarUrl}
                          alt={`${kid.name} avatar`}
                          className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-sm transition group-hover:scale-105"
                          loading="eager"
                          decoding="async"
                        />
                        <div className="flex items-end justify-between gap-3">
                          <p className="text-3xl font-black text-ink">{kid.name}</p>
                          <span
                            className={`grid h-8 w-8 place-items-center rounded-full text-sm font-black ${
                              selectedKidId === kid.id ? "bg-mint text-white" : "bg-white/70 text-ink/40"
                            }`}
                          >
                            <Check size={16} />
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="quiet-card flex flex-col justify-between p-4">
                  <div>
                    <p className="section-heading">{t("kid.openTitle")}</p>
                    <p className="section-copy mt-1">{t("kid.openHelp")}</p>
                  </div>
                  <div className="mt-6 space-y-3">
                    <label>
                      <span className="field-label">{t("kid.pin")}</span>
                      <div className="relative">
                        <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                        <input
                          value={pin}
                          onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 8))}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") void handleLogin();
                          }}
                          inputMode="numeric"
                          type="password"
                          placeholder="0000"
                          className="field-input pl-10 text-lg font-black"
                        />
                      </div>
                    </label>
                    <button
                      type="button"
                      onClick={handleLogin}
                      disabled={isLoggingIn}
                      className="action-button action-primary w-full"
                    >
                      {isLoggingIn ? t("kid.opening") : t("kid.open")}
                    </button>
                    <label className="flex items-center gap-3 rounded-[8px] bg-ink/5 px-3 py-3 text-sm font-black text-ink/65">
                      <input
                        checked={rememberKid}
                        onChange={(event) => setRememberKid(event.target.checked)}
                        type="checkbox"
                        className="h-5 w-5 accent-mint"
                      />
                      {t("kid.remember")}
                    </label>
                  </div>
                </div>
              </div>
            )}
            {message && <p className="mt-4 rounded-[8px] bg-coral/10 p-3 font-bold text-coral">{message}</p>}
          </section>
        </div>
        {isLoggingIn && <VaultOpeningOverlay kidName={selectedKid?.name ?? t("kid.yourVault")} />}
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="app-container">
        <header className="app-header">
          <div>
            <div className="eyebrow-pill mb-3">
              <BadgeDollarSign size={17} className="text-mint" />
              {t("kid.vault", { name: kidData.account.name })}
            </div>
            <h1 className="page-title">{t("kid.myBank")}</h1>
            <p className="page-subtitle">
              {t("kid.subtitle")}
            </p>
          </div>
          <div className="app-actions">
            <LanguageToggle compact />
            <ThemeToggle compact />
            <KidPinSettings account={kidData.account} variant="button" />
            <button
              type="button"
              onClick={() => {
                setIsSigningOut(true);
                fetch("/api/kids/logout", { method: "POST" }).finally(() => {
                  setKidData(null);
                  setMessage("");
                  setIsSigningOut(false);
                });
              }}
              className="action-button action-quiet"
            >
              <LogOut size={17} />
              {t("kid.switch")}
            </button>
          </div>
        </header>

        {message && <p className="mb-5 rounded-[8px] bg-coral/10 p-4 font-bold text-coral">{message}</p>}

        <div className="space-y-4 sm:space-y-5">
          {isLoadingDetails && (
            <p className="rounded-[8px] bg-white/80 px-4 py-3 text-sm font-black text-ink/55 shadow-sm">
              {t("kid.loading")}
            </p>
          )}
          {isLoggingIn && (
            <p className="rounded-[8px] bg-white/80 px-4 py-3 text-sm font-black text-ink/55 shadow-sm">
              {t("kid.checking")}
            </p>
          )}
          <BalanceCard
            account={kidData.account}
            animation={moneyAnimation?.accountId === kidData.account.id ? moneyAnimation : null}
            showQuickActions
            onAvatarUpload={handleAvatarUpload}
            onProfileStyleChange={handleProfileStyleChange}
            onQuickAdd={(_, type) => setActiveMove(type)}
          />
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <KidWealthTrail account={kidData.account} data={kidData.ledger} />
            <ActivityFeed transactions={kidData.transactions} compact />
          </div>
          <KidProgressPanel accounts={[kidData.account]} transactions={kidData.transactions} />
          <ToolFrame title={t("kid.moreTools")} description={t("kid.moreToolsDescription")}>
            <StandardCalculator />
          </ToolFrame>
        </div>
      </div>

      {activeMove && (
        <KidTransactionModal
          account={kidData.account}
          type={activeMove}
          onClose={() => setActiveMove(null)}
          onSave={saveKidTransaction}
        />
      )}
      {isSigningOut && (
        <SessionLoadingOverlay title={t("kid.switchingTitle")} message={t("kid.switchingMessage")} />
      )}
    </main>
  );
}

function VaultOpeningOverlay({ kidName }: { kidName: string }) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-4 backdrop-blur-sm">
      <div className="vault-open-card w-full max-w-sm rounded-[8px] bg-white p-6 text-center shadow-lift">
        <div className="vault-door mx-auto mb-5 grid h-28 w-28 place-items-center rounded-[24px] bg-ink text-white shadow-lift">
          <div className="vault-dial grid h-16 w-16 place-items-center rounded-full border-8 border-mint/70 bg-white/10">
            <LockKeyhole size={28} className="text-mint" />
          </div>
        </div>
        <p className="text-sm font-black uppercase text-mint">{t("kid.checking")}</p>
        <h2 className="mt-1 text-2xl font-black text-ink">{t("kid.openingVault", { name: kidName })}</h2>
        <div className="mt-5 flex justify-center gap-2">
          <span className="vault-light h-3 w-3 rounded-full bg-mint" />
          <span className="vault-light h-3 w-3 rounded-full bg-mint" />
          <span className="vault-light h-3 w-3 rounded-full bg-mint" />
        </div>
      </div>
    </div>
  );
}

function bumpKidLedger(ledger: KidLedgerPoint[], delta: number, currentBalance: number) {
  const todayId = new Date().toISOString().slice(0, 10);
  const index = ledger.findIndex((point) => point.id === todayId);

  if (index >= 0) {
    return ledger.map((point, pointIndex) =>
      pointIndex === index ? { ...point, balance: Number((point.balance + delta).toFixed(2)) } : point
    );
  }

  return [
    ...ledger,
    {
      id: todayId,
      date: new Date().toISOString(),
      balance: currentBalance
    }
  ];
}
