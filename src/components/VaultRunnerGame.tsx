"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Gamepad2, Medal, Play, RotateCcw, Trophy } from "lucide-react";
import type { Account, GameScore, KidLoginAccount } from "@/components/types";

type PlayerState = {
  accountId: string;
  name: string;
  themeColor: string;
  y: number;
  velocity: number;
  score: number;
  coins: number;
};

type RunnerItem = {
  id: number;
  x: number;
  y: number;
  type: "coin" | "bonus" | "spend";
};

const ground = 0;
const gravity = 0.9;
const jumpPower = 14;

export default function VaultRunnerGame({
  account,
  allKids,
  initialScores
}: {
  account: Account;
  allKids: KidLoginAccount[];
  initialScores: GameScore[];
}) {
  const otherKid = allKids.find((kid) => kid.id !== account.id);
  const [mode, setMode] = useState<"solo" | "duo">("solo");
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45);
  const [players, setPlayers] = useState<PlayerState[]>(() => makePlayers(account, otherKid, "solo"));
  const [items, setItems] = useState<RunnerItem[]>([]);
  const [scores, setScores] = useState(initialScores);
  const [message, setMessage] = useState("Run, jump, collect save coins, and dodge spend traps.");
  const tickRef = useRef(0);
  const playersRef = useRef(players);
  const modeRef = useRef(mode);

  const leader = useMemo(
    () => [...scores].sort((a, b) => b.score - a.score)[0],
    [scores]
  );

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "w" || event.key === " ") jump(0);
      if (event.key === "ArrowUp") jump(1);
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = window.setInterval(() => {
      tickRef.current += 1;
      setTimeLeft((current) => {
        if (current <= 1) {
          setIsPlaying(false);
          void saveScores(playersRef.current, modeRef.current);
          return 0;
        }
        return current - 1;
      });

      setItems((current) => {
        const moved = current
          .map((item) => ({ ...item, x: item.x - 5 }))
          .filter((item) => item.x > -10);

        if (tickRef.current % 10 === 0) {
          const seed = tickRef.current % 30;
          moved.push({
            id: Date.now() + tickRef.current,
            x: 104,
            y: seed === 0 ? 48 : seed % 3 === 0 ? 18 : 30,
            type: seed === 0 ? "bonus" : seed % 4 === 0 ? "spend" : "coin"
          });
        }

        return moved;
      });

      setPlayers((current) =>
        current.map((player) => {
          const nextVelocity = player.velocity - gravity;
          const nextY = Math.max(ground, player.y + nextVelocity);
          return {
            ...player,
            y: nextY,
            velocity: nextY === ground ? 0 : nextVelocity
          };
        })
      );
    }, 90);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || items.length === 0) return;

    setPlayers((currentPlayers) => {
      const collectedIds = new Set<number>();
      const nextPlayers = currentPlayers.map((player, index) => {
        const playerX = index === 0 ? 20 : 32;
        const hit = items.find((item) => {
          const closeX = Math.abs(item.x - playerX) < 7;
          const closeY = Math.abs(item.y - (player.y + 10)) < 16;
          return closeX && closeY;
        });

        if (!hit) return player;
        collectedIds.add(hit.id);
        const delta = hit.type === "spend" ? -30 : hit.type === "bonus" ? 50 : 20;

        return {
          ...player,
          score: Math.max(0, player.score + delta),
          coins: hit.type === "spend" ? player.coins : player.coins + 1
        };
      });

      if (collectedIds.size > 0) {
        setItems((currentItems) => currentItems.filter((item) => !collectedIds.has(item.id)));
      }

      return nextPlayers;
    });
  }, [isPlaying, items]);

  function start(nextMode = mode) {
    setMode(nextMode);
    setTimeLeft(45);
    setItems([]);
    tickRef.current = 0;
    setPlayers(makePlayers(account, otherKid, nextMode));
    setMessage(nextMode === "duo" ? "Basil uses W/space. Osama uses arrow up." : "Use jump to catch saves.");
    setIsPlaying(true);
  }

  function jump(index: number) {
    setPlayers((current) =>
      current.map((player, playerIndex) =>
        playerIndex === index && player.y === ground ? { ...player, velocity: jumpPower } : player
      )
    );
  }

  async function saveScores(results: PlayerState[], gameMode: "solo" | "duo") {
    setMessage("Score saved. Try to beat the leaderboard next time.");

    const savedLists = await Promise.all(
      results.map((player) =>
        fetch("/api/game-scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId: player.accountId,
            mode: gameMode,
            score: player.score,
            coins: player.coins
          })
        }).then((response) => response.json().catch(() => []))
      )
    ).catch(() => []);

    const latest = savedLists.find((list) => Array.isArray(list));
    if (Array.isArray(latest)) setScores(latest);
  }

  return (
    <section className="overflow-hidden rounded-[8px] bg-white shadow-lift">
      <div className="bg-ink p-5 text-white">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-sm font-black">
          <Gamepad2 size={16} className="text-[#FFC64E]" />
          Vault Runner
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">Jump for savings</h2>
            <p className="mt-1 text-sm font-bold text-white/65">Platform race: coins grow the vault, traps shrink it.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => start("solo")}
              className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-mint px-4 font-black text-white transition hover:-translate-y-0.5"
            >
              <Play size={17} />
              1 Player
            </button>
            <button
              type="button"
              onClick={() => start("duo")}
              disabled={!otherKid}
              className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-[#FFC64E] px-4 font-black text-ink transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              <RotateCcw size={17} />
              2 Players
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[1fr_280px]">
        <div>
          <div className="mb-3 grid grid-cols-3 gap-2">
            <GameStat label="Time" value={timeLeft} />
            <GameStat label="Mode" value={mode === "duo" ? "2P" : "1P"} />
            <GameStat label="Top" value={leader ? leader.score : 0} />
          </div>

          <div className="relative h-72 overflow-hidden rounded-[8px] border-4 border-white bg-gradient-to-b from-[#9FE7FF] to-[#D9FBEA] shadow-inner">
            <div className="absolute inset-x-0 bottom-0 h-16 bg-[#7ED957]" />
            <div className="absolute inset-x-0 bottom-14 h-3 bg-[#8A5A33]" />
            <div className="absolute left-4 top-4 rounded-[8px] bg-white/85 px-3 py-2 text-sm font-black text-ink shadow-sm">
              {message}
            </div>

            {items.map((item) => (
              <div
                key={item.id}
                className={`absolute grid h-9 w-9 place-items-center rounded-full text-sm font-black shadow-md ${
                  item.type === "spend" ? "bg-coral text-white" : item.type === "bonus" ? "bg-[#FFC64E] text-ink" : "bg-mint text-white"
                }`}
                style={{ left: `${item.x}%`, bottom: `${item.y + 44}px` }}
              >
                {item.type === "spend" ? "!" : item.type === "bonus" ? "*" : "+"}
              </div>
            ))}

            {players.map((player, index) => (
              <div
                key={player.accountId}
                className="absolute flex flex-col items-center transition-[bottom] duration-75"
                style={{
                  left: `${index === 0 ? 18 : 30}%`,
                  bottom: `${player.y + 58}px`
                }}
              >
                <span className="mb-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-black text-ink shadow-sm">
                  {player.name} {player.score}
                </span>
                <span
                  className="grid h-12 w-12 place-items-center rounded-[8px] border-4 border-white font-black text-white shadow-md"
                  style={{ backgroundColor: player.themeColor }}
                >
                  {player.name[0]}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => jump(0)}
              className="h-12 rounded-[8px] bg-mint font-black text-white transition hover:-translate-y-0.5"
            >
              {players[0]?.name ?? account.name} jump
            </button>
            {mode === "duo" && players[1] && (
              <button
                type="button"
                onClick={() => jump(1)}
                className="h-12 rounded-[8px] bg-[#FFC64E] font-black text-ink transition hover:-translate-y-0.5"
              >
                {players[1].name} jump
              </button>
            )}
          </div>
        </div>

        <aside className="rounded-[8px] bg-cream p-4">
          <p className="mb-3 inline-flex items-center gap-2 text-lg font-black text-ink">
            <Trophy size={18} className="text-[#E6A400]" />
            Scoreboard
          </p>
          <div className="space-y-2">
            {scores.length === 0 ? (
              <p className="rounded-[8px] bg-white p-3 text-sm font-bold text-ink/55">No scores yet.</p>
            ) : (
              scores.slice(0, 8).map((score, index) => (
                <div key={score.id} className="flex items-center gap-2 rounded-[8px] bg-white p-3 shadow-sm">
                  <Medal size={16} className={index === 0 ? "text-[#E6A400]" : "text-ink/35"} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-ink">{score.accountName}</p>
                    <p className="text-xs font-bold text-ink/45">{score.mode} - {score.coins} coins</p>
                  </div>
                  <p className="text-lg font-black text-mint">{score.score}</p>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

function makePlayers(account: Account, otherKid: KidLoginAccount | undefined, mode: "solo" | "duo"): PlayerState[] {
  const players: PlayerState[] = [
    {
      accountId: account.id,
      name: account.name,
      themeColor: account.themeColor,
      y: ground,
      velocity: 0,
      score: 0,
      coins: 0
    }
  ];

  if (mode === "duo" && otherKid) {
    players.push({
      accountId: otherKid.id,
      name: otherKid.name,
      themeColor: otherKid.themeColor,
      y: ground,
      velocity: 0,
      score: 0,
      coins: 0
    });
  }

  return players;
}

function GameStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[8px] bg-white p-3 text-center shadow-sm">
      <p className="text-xs font-black uppercase text-ink/45">{label}</p>
      <p className="text-xl font-black text-ink">{value}</p>
    </div>
  );
}
