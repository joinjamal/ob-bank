"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Calculator,
  Coins,
  Gamepad2,
  Gift,
  PiggyBank,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Zap
} from "lucide-react";
import type { Account } from "@/components/types";
import { formatMoney } from "@/lib/money";

type GameTile = {
  id: number;
  type: "save" | "spend" | "bonus";
  label: string;
  value: number;
};

const saveReasons = ["Save", "Chore", "Gift", "Bonus", "Goal"];
const spendReasons = ["Snack", "Skin", "Toy", "Impulse", "Upgrade"];

function buildTiles(round: number) {
  return Array.from({ length: 9 }, (_, index) => {
    const seed = (round * 11 + index * 7) % 10;

    if (seed === 0 || seed === 6) {
      return {
        id: round * 100 + index,
        type: "bonus",
        label: "Bonus",
        value: 15
      } satisfies GameTile;
    }

    if (seed <= 3) {
      return {
        id: round * 100 + index,
        type: "spend",
        label: spendReasons[(round + index) % spendReasons.length],
        value: -5
      } satisfies GameTile;
    }

    return {
      id: round * 100 + index,
      type: "save",
      label: saveReasons[(round + index) % saveReasons.length],
      value: 10
    } satisfies GameTile;
  });
}

export default function KidMoneyLab({ accounts }: { accounts: Account[] }) {
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id ?? "");
  const [goalAmount, setGoalAmount] = useState("");
  const [weeklySave, setWeeklySave] = useState("25");
  const [boostAmount, setBoostAmount] = useState("0");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isPlaying, setIsPlaying] = useState(false);
  const [round, setRound] = useState(1);
  const [pickedIds, setPickedIds] = useState<number[]>([]);

  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) ?? accounts[0];
  const currentBalance = selectedAccount?.currentBalance ?? 0;
  const parsedTarget = Number(goalAmount || selectedAccount?.goalAmount || 0);
  const target = Number.isFinite(parsedTarget) ? parsedTarget : 0;
  const parsedWeekly = Number(weeklySave);
  const weekly = Number.isFinite(parsedWeekly) ? parsedWeekly : 0;
  const parsedBoost = Number(boostAmount);
  const boost = Number.isFinite(parsedBoost) ? parsedBoost : 0;
  const remaining = Math.max(0, target - currentBalance - boost);
  const weeks = Number.isFinite(weekly) && weekly > 0 ? Math.ceil(remaining / weekly) : null;
  const tiles = useMemo(() => buildTiles(round), [round]);
  const lesson =
    score >= 80
      ? "Saving choices stacked up fast."
      : score >= 40
        ? "You protected the vault pretty well."
        : "Try grabbing more save tokens than spend tokens.";

  useEffect(() => {
    if (!accounts[0]) return;
    setSelectedAccountId((current) => current || accounts[0].id);
  }, [accounts]);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          setIsPlaying(false);
          return 0;
        }
        return current - 1;
      });
      setRound((current) => current + 1);
      setPickedIds([]);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  function startGame() {
    setScore(0);
    setTimeLeft(20);
    setRound((current) => current + 1);
    setPickedIds([]);
    setIsPlaying(true);
  }

  function pickTile(tile: GameTile) {
    if (!isPlaying || pickedIds.includes(tile.id)) return;
    const nextScore = Math.max(0, score + tile.value);
    setPickedIds((current) => [...current, tile.id]);
    setScore(nextScore);
    setBestScore((current) => Math.max(current, nextScore));
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="overflow-hidden rounded-[8px] bg-white shadow-lift">
        <div className="bg-[#FFF0BE] p-5">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-black text-ink shadow-sm">
            <Calculator size={16} className="text-[#E6A400]" />
            Goal calculator
          </div>
          <h2 className="text-2xl font-black text-ink">Plan the next win</h2>
          <p className="mt-1 text-sm font-bold text-ink/60">
            Try different saving amounts and see how quickly a goal gets closer.
          </p>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-black text-ink/70">Kid</span>
            <select
              value={selectedAccount?.id ?? ""}
              onChange={(event) => setSelectedAccountId(event.target.value)}
              className="h-12 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-black outline-none transition focus:border-mint"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} - balance {formatMoney(account.currentBalance)}
                </option>
              ))}
            </select>
          </label>

          <NumberField
            label="Goal amount"
            value={goalAmount}
            placeholder={selectedAccount?.goalAmount ? String(selectedAccount.goalAmount) : "300"}
            onChange={setGoalAmount}
          />
          <NumberField label="Save each week" value={weeklySave} placeholder="25" onChange={setWeeklySave} />
          <NumberField label="Extra boost now" value={boostAmount} placeholder="0" onChange={setBoostAmount} />

          <div className="rounded-[8px] bg-mint/10 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-black text-mint">
              <Target size={16} />
              Time to goal
            </p>
            <p className="mt-2 text-3xl font-black text-ink">
              {target <= 0 ? "Pick a goal" : remaining === 0 ? "Ready now" : weeks === null ? "Add weekly save" : `${weeks} week${weeks === 1 ? "" : "s"}`}
            </p>
            <p className="mt-1 text-sm font-bold text-ink/55">
              {target > 0 ? `${formatMoney(remaining)} still needed` : "Use the goal on your card or type a new one."}
            </p>
          </div>

          <div className="md:col-span-2 grid gap-3 sm:grid-cols-3">
            <MiniStat icon={<PiggyBank size={16} />} label="Balance" value={formatMoney(currentBalance)} />
            <MiniStat icon={<Zap size={16} />} label="With boost" value={formatMoney(currentBalance + (Number.isFinite(boost) ? boost : 0))} />
            <MiniStat icon={<Trophy size={16} />} label="Target" value={target > 0 ? formatMoney(target) : "Set one"} />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[8px] bg-white shadow-lift">
        <div className="bg-ink p-5 text-white">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-sm font-black">
            <Gamepad2 size={16} className="text-[#FFC64E]" />
            Save sprint
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black">Catch saves, skip spends</h2>
              <p className="mt-1 text-sm font-bold text-white/65">
                Choose the tiles that grow the vault before time runs out.
              </p>
            </div>
            <button
              type="button"
              onClick={startGame}
              className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-mint px-4 font-black text-white transition hover:-translate-y-0.5"
            >
              {isPlaying ? <RotateCcw size={17} /> : <Sparkles size={17} />}
              {isPlaying ? "Restart" : "Start"}
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-4 grid grid-cols-3 gap-3">
            <GameStat label="Score" value={score} />
            <GameStat label="Time" value={timeLeft} />
            <GameStat label="Best" value={bestScore} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {tiles.map((tile) => {
              const picked = pickedIds.includes(tile.id);
              const isGood = tile.type !== "spend";

              return (
                <button
                  key={tile.id}
                  type="button"
                  disabled={!isPlaying || picked}
                  onClick={() => pickTile(tile)}
                  className={`money-tile min-h-[76px] rounded-[8px] border-2 p-2 text-center shadow-sm transition disabled:cursor-default ${
                    picked
                      ? "border-ink/5 bg-ink/5 opacity-45"
                      : isGood
                        ? "border-mint/25 bg-mint/10 hover:-translate-y-1 hover:bg-mint/15"
                        : "border-coral/25 bg-coral/10 hover:-translate-y-1 hover:bg-coral/15"
                  }`}
                >
                  <span
                    className={`mx-auto mb-1 grid h-9 w-9 place-items-center rounded-full ${
                      isGood ? "bg-mint text-white" : "bg-coral text-white"
                    }`}
                  >
                    {tile.type === "bonus" ? <Gift size={18} /> : isGood ? <Coins size={18} /> : <Zap size={18} />}
                  </span>
                  <span className="block text-xs font-black text-ink/55">{tile.label}</span>
                  <span className={`block text-sm font-black ${isGood ? "text-mint" : "text-coral"}`}>
                    {tile.value > 0 ? "+" : ""}
                    {tile.value}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-[8px] bg-cream px-4 py-3">
            <p className="text-sm font-black text-ink">{isPlaying ? "Fast choice round" : "Lesson"}</p>
            <p className="text-sm font-bold text-ink/60">
              {isPlaying ? "Good saving choices are worth more than quick spending." : lesson}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function NumberField({
  label,
  value,
  placeholder,
  onChange
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-ink/70">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="decimal"
        placeholder={placeholder}
        className="h-12 w-full rounded-[8px] border-2 border-ink/10 bg-white px-3 font-black outline-none transition focus:border-mint"
      />
    </label>
  );
}

function MiniStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-ink/5 p-3">
      <p className="mb-1 inline-flex items-center gap-1 text-xs font-black uppercase text-ink/45">
        {icon}
        {label}
      </p>
      <p className="text-lg font-black text-ink">{value}</p>
    </div>
  );
}

function GameStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[8px] bg-ink/5 p-3 text-center">
      <p className="text-xs font-black uppercase text-ink/45">{label}</p>
      <p className="text-2xl font-black text-ink">{value}</p>
    </div>
  );
}
