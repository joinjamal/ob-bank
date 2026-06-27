"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { BadgeDollarSign, Check, KeyRound, LockKeyhole, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { updateAccountAvatar } from "@/app/actions";
import ActivityFeed from "@/components/ActivityFeed";
import BalanceCard from "@/components/BalanceCard";
import KidPinSettings from "@/components/KidPinSettings";
import KidTransactionModal from "@/components/KidTransactionModal";
import LanguageToggle from "@/components/LanguageToggle";
import SessionLoadingOverlay from "@/components/SessionLoadingOverlay";
import ThemeToggle from "@/components/ThemeToggle";
import ToolFrame from "@/components/ToolFrame";
import type { Account, KidPickerAccount, Transaction } from "@/components/types";
import { useI18n } from "@/lib/i18n";
import { makeKidVaultJoke } from "@/lib/kidJokes";
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
  goalReached?: boolean;
} | null;

const minimumVaultAnimationMs = 0;

const KidWealthTrail = dynamic(() => import("@/components/KidWealthTrail"), {
  ssr: false,
  loading: () => <section className="surface-card h-72 animate-pulse" />
});

export default function KidPortal({
  kids,
  familyName,
  initialKidData = null
}: {
  kids: KidPickerAccount[];
  familyName: string;
  initialKidData?: KidData | null;
}) {
  const { locale, t } = useI18n();
  const [selectedKidId, setSelectedKidId] = useState(kids[0]?.id ?? "");
  const [pin, setPin] = useState("");
  const [rememberKid, setRememberKid] = useState(true);
  const [kidData, setKidData] = useState<KidData | null>(initialKidData);
  const [vaultSubtitle, setVaultSubtitle] = useState(() =>
    initialKidData ? makeKidVaultJoke(locale, initialKidData.account.name) : ""
  );
  const [activeMove, setActiveMove] = useState<"Deposit" | "Withdrawal" | null>(null);
  const [moneyAnimation, setMoneyAnimation] = useState<MoneyAnimation>(null);
  const [message, setMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [pinCheckStatus, setPinCheckStatus] = useState<"idle" | "checking" | "ready" | "invalid">("idle");
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [loadedDetailsFor, setLoadedDetailsFor] = useState<string | null>(initialKidData?.ledger.length ? initialKidData.account.id : null);
  const animationTimer = useRef<number | null>(null);
  const loginRequestRef = useRef<{
    key: string;
    promise: Promise<{ ok: boolean; body: KidData | { message?: string } | null }>;
  } | null>(null);

  const selectedKid = useMemo(
    () => kids.find((kid) => kid.id === selectedKidId) ?? kids[0],
    [kids, selectedKidId]
  );

  useEffect(() => {
    if (kidData) {
      setVaultSubtitle(makeKidVaultJoke(locale, kidData.account.name));
    }
  }, [kidData?.account.id, kidData?.account.name, locale]);

  const loginKey = selectedKid && /^\d{4,8}$/.test(pin) ? `${selectedKid.id}:${pin}:${rememberKid}` : "";

  const requestKidLoginFor = useCallback((
    kid: Pick<Account, "id">,
    nextPin: string,
    shouldRemember: boolean
  ) => {
    if (!/^\d{4,8}$/.test(nextPin)) return null;
    const key = `${kid.id}:${nextPin}:${shouldRemember}`;

    if (loginRequestRef.current?.key === key) {
      return loginRequestRef.current.promise;
    }

    const promise = fetch("/api/kids/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId: kid.id, pin: nextPin, remember: shouldRemember })
    }).then(async (response) => ({
      ok: response.ok,
      body: await response.json().catch(() => null)
    }));

    loginRequestRef.current = { key, promise };
    return promise;
  }, []);

  const requestKidLogin = useCallback(() => {
    if (!selectedKid || !loginKey) return null;
    return requestKidLoginFor(selectedKid, pin, rememberKid);
  }, [loginKey, pin, rememberKid, requestKidLoginFor, selectedKid]);

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
        setLoadedDetailsFor(accountId);
    } catch {
      // Keep the vault open even if the chart/activity refresh is slow.
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    if (kidData && loadedDetailsFor !== kidData.account.id) {
      void loadKidDetails(kidData.account.id);
    }
  }, [kidData, loadKidDetails, loadedDetailsFor]);

  const openKidVault = useCallback((body: KidData) => {
    loginRequestRef.current = null;
    setKidData(body);
    setLoadedDetailsFor(null);
    setPin("");
    setPinCheckStatus("idle");
    setIsLoggingIn(false);
    setMessage("");
    playVaultUnlockSound();
  }, []);

  const finishKidLogin = useCallback((
    activeKey: string,
    result: { ok: boolean; body: KidData | { message?: string } | null }
  ) => {
    if (loginRequestRef.current?.key !== activeKey) return;

    if (result.ok) {
      openKidVault(result.body as KidData);
      return;
    }

    setPinCheckStatus("invalid");
    setIsLoggingIn(false);
    setMessage((result.body as { message?: string } | null)?.message ?? "That PIN did not match.");
    playVaultErrorSound();
  }, [openKidVault]);

  const startKidLoginCheck = useCallback((nextPin: string) => {
    if (!selectedKid || !/^\d{4,8}$/.test(nextPin)) {
      loginRequestRef.current = null;
      setPinCheckStatus("idle");
      setIsLoggingIn(false);
      return;
    }
    const activeKey = `${selectedKid.id}:${nextPin}:${rememberKid}`;
    setMessage("");
    setIsLoggingIn(true);
    setPinCheckStatus("checking");
    void requestKidLoginFor(selectedKid, nextPin, rememberKid)?.then((result) => {
      finishKidLogin(activeKey, result);
    }).catch(() => {
      if (loginRequestRef.current?.key === activeKey) {
        setPinCheckStatus("invalid");
        setIsLoggingIn(false);
        setMessage("Could not open your profile.");
        playVaultErrorSound();
      }
    });
  }, [finishKidLogin, rememberKid, requestKidLoginFor, selectedKid]);

  async function handleLogin() {
    setMessage("");

    if (!selectedKid || !/^\d{4,8}$/.test(pin)) {
      setMessage(t("kid.choose"));
      return;
    }

    setIsLoggingIn(true);

    try {
      const startedAt = performance.now();
      const result = await (requestKidLogin() ?? Promise.resolve({ ok: false, body: null }));
      const body = result.body;

      if (!result.ok) {
        setPinCheckStatus("invalid");
        throw new Error(body?.message ?? "Could not open your profile.");
      }

      openKidVault(body as KidData);
      const remainingAnimationMs = minimumVaultAnimationMs - (performance.now() - startedAt);
      if (remainingAnimationMs > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, remainingAnimationMs));
      }
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

  function triggerMoneyAnimation(accountId: string, type: "Deposit" | "Withdrawal", goalReached = false) {
    playTransactionSound(type);

    if (animationTimer.current) {
      window.clearTimeout(animationTimer.current);
    }

    setMoneyAnimation({ accountId, type, id: Date.now(), goalReached });
    animationTimer.current = window.setTimeout(() => setMoneyAnimation(null), goalReached ? 1900 : 1200);
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
    const goalReached =
      payload.type === "Deposit" &&
      Boolean(kidData.account.goalAmount) &&
      kidData.account.currentBalance < Number(kidData.account.goalAmount) &&
      nextAccount.currentBalance >= Number(kidData.account.goalAmount);

    setKidData({
      ...kidData,
      account: nextAccount,
      transactions: [optimisticTransaction, ...kidData.transactions].slice(0, 80),
      ledger: bumpKidLedger(kidData.ledger, delta, nextAccount.currentBalance)
    });
    triggerMoneyAnimation(payload.accountId, payload.type, goalReached);

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
      <main className="app-shell kid-login-shell">
        <div className="app-container max-w-5xl">
          <header className="kid-login-topbar">
            <div className="min-w-0">
              <div className="kid-login-badge">
                <BadgeDollarSign size={17} className="text-mint" />
                {t("kid.loginBadge")}
              </div>
              <h1 className="kid-login-title">{t("kid.chooseVault")}</h1>
              <p className="kid-login-subtitle">
                {familyName}: {t("kid.choose")}
              </p>
            </div>
            <div className="kid-login-actions">
              <Link
                href="/parent"
                className="kid-login-parent-button"
              >
                <UserRound size={17} className="text-mint" />
                {t("kid.parent")}
              </Link>
              <LanguageToggle compact />
              <ThemeToggle compact />
            </div>
          </header>

          <section className="kid-entry-panel kid-login-panel">
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
              <div className="kid-login-grid">
                <div className="kid-profile-grid">
                  {kids.map((kid) => (
                    <button
                      key={kid.id}
                      type="button"
                      onClick={() => {
                        setSelectedKidId(kid.id);
                        setPin("");
                        setMessage("");
                        setPinCheckStatus("idle");
                      }}
                      data-account-id={kid.id}
                      className={`kid-profile-tile kid-color-surface group ${
                        selectedKidId === kid.id ? "border-mint shadow-lift" : "border-white/90 shadow-sm"
                      }`}
                      style={{ backgroundColor: kid.profileColor, "--kid-theme-color": kid.themeColor } as CSSProperties}
                    >
                      <div className="kid-profile-tile-inner">
                        <img
                          src={kid.avatarUrl}
                          alt={`${kid.name} avatar`}
                          className="kid-profile-avatar"
                          loading="eager"
                          decoding="async"
                        />
                        <div className="kid-profile-name-row">
                          <p className="kid-profile-name">{kid.name}</p>
                          <span
                            className={`kid-profile-check ${
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

                <div className="quiet-card kid-pin-card">
                  <div>
                    <p className="kid-pin-title">{selectedKid ? t("kid.vault", { name: selectedKid.name }) : t("kid.openTitle")}</p>
                    <p className="kid-pin-help">{t("kid.openHelp")}</p>
                  </div>
                  <div className="kid-pin-controls">
                    <label>
                      <span className="field-label">{t("kid.pin")}</span>
                      <div className="relative">
                        <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                        <input
                          value={pin}
                          onChange={(event) => {
                            const nextPin = event.target.value.replace(/\D/g, "").slice(0, 8);
                            setPin(nextPin);
                            startKidLoginCheck(nextPin);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") void handleLogin();
                          }}
                          inputMode="numeric"
                          type="tel"
                          enterKeyHint="done"
                          autoComplete="off"
                          placeholder="0000"
                          className="field-input kid-pin-input"
                        />
                      </div>
                    </label>
                    <div className="kid-pin-status">
                      {isLoggingIn || pinCheckStatus === "checking"
                        ? t("auth.checking")
                        : pin.length >= 4
                          ? t("kid.open")
                          : t("kid.openTitle")}
                    </div>
                    <label className="kid-remember-row">
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
        {isLoggingIn && <VaultOpeningPill kidName={selectedKid?.name ?? t("kid.yourVault")} />}
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="app-container">
        <header className="kid-vault-topbar">
          <div className="kid-vault-identity">
            <img
              src={kidData.account.avatarUrl}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
            />
            <div className="min-w-0">
              <div className="kid-vault-name">
                <BadgeDollarSign size={16} className="text-mint" />
                <span className="truncate">{t("kid.vault", { name: kidData.account.name })}</span>
              </div>
              <p className="kid-vault-line">{vaultSubtitle || t("kid.subtitle")}</p>
            </div>
          </div>
          <div className="kid-vault-actions" aria-label={t("kid.settings")}>
            <LanguageToggle compact />
            <ThemeToggle compact />
            <KidPinSettings account={kidData.account} variant="icon" />
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
              className="icon-button"
              aria-label={t("kid.logout")}
              title={t("kid.logout")}
            >
              <LogOut size={18} />
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
          <div className="grid gap-4 lg:grid-cols-2">
            <ToolFrame title={t("kidTrail.badge")} description={t("kidTrail.hiddenHelp")}>
              <KidWealthTrail account={kidData.account} data={kidData.ledger} />
            </ToolFrame>
            <ToolFrame title={t("activity.recent")} description={t("activity.hiddenHelp")}>
              <ActivityFeed transactions={kidData.transactions} compact />
            </ToolFrame>
          </div>
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

function VaultOpeningPill({ kidName }: { kidName: string }) {
  const { t } = useI18n();

  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-50 flex justify-center">
      <div className="vault-unlock-pill flex max-w-[92vw] items-center gap-3 rounded-full bg-white/95 px-4 py-3 text-ink shadow-lift">
        <div className="mini-vault grid h-10 w-10 place-items-center rounded-full bg-ink text-mint">
          <LockKeyhole size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-mint">{t("kid.checking")}</p>
          <p className="truncate text-sm font-black">{t("kid.openingVault", { name: kidName })}</p>
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
