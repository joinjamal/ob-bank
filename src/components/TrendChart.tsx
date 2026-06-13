"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { TrendingUp, Trophy } from "lucide-react";
import { LedgerPoint } from "@/components/types";
import { formatMoney } from "@/lib/money";

function getChange(data: LedgerPoint[], key: "basilBalance" | "osamaBalance") {
  if (data.length < 2) return 0;
  return data[data.length - 1][key] - data[0][key];
}

function TrailBadge({
  name,
  color,
  balance,
  change
}: {
  name: string;
  color: string;
  balance: number;
  change: number;
}) {
  return (
    <div className="rounded-[8px] bg-white/80 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-sm font-black text-ink/65">{name}</p>
      </div>
      <p className="mt-1 text-2xl font-black text-ink">{formatMoney(balance)}</p>
      <p className={`mt-1 text-xs font-black ${change >= 0 ? "text-mint" : "text-coral"}`}>
        {change >= 0 ? "+" : "-"}
        {formatMoney(Math.abs(change))} on the trail
      </p>
    </div>
  );
}

export default function TrendChart({ data }: { data: LedgerPoint[] }) {
  const chartData = data.map((point) => ({
    ...point,
    label: format(new Date(point.date), "MMM d")
  }));
  const latest = data[data.length - 1];
  const basilChange = getChange(data, "basilBalance");
  const osamaChange = getChange(data, "osamaBalance");
  const leader =
    latest && latest.basilBalance !== latest.osamaBalance
      ? latest.basilBalance > latest.osamaBalance
        ? "Basil"
        : "Osama"
      : null;

  return (
    <section className="overflow-hidden rounded-[8px] bg-white shadow-lift">
      <div className="bg-mint/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-black text-ink shadow-sm">
              <TrendingUp size={16} className="text-mint" />
              Wealth trail
            </div>
            <h2 className="text-2xl font-black text-ink">Watch your savings climb</h2>
            <p className="mt-1 text-sm font-bold text-ink/60">
              Every add or spend becomes a step on the trail.
            </p>
          </div>
          {leader && (
            <div className="inline-flex items-center gap-2 rounded-[8px] bg-white px-4 py-3 text-sm font-black text-ink shadow-sm">
              <Trophy size={17} className="text-[#FFC64E]" />
              Trail leader: {leader}
            </div>
          )}
        </div>

        {latest && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <TrailBadge name="Basil" color="#2F7DF6" balance={latest.basilBalance} change={basilChange} />
            <TrailBadge name="Osama" color="#8E5CF7" balance={latest.osamaBalance} change={osamaChange} />
          </div>
        )}
      </div>

      <div className="h-80 w-full p-4">
        {chartData.length === 0 ? (
          <div className="grid h-full place-items-center rounded-[8px] bg-ink/5 text-center font-bold text-ink/55">
            Add your first money move to start the trail.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="basilTrail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2F7DF6" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#2F7DF6" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="osamaTrail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8E5CF7" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="#8E5CF7" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#172033" strokeDasharray="4 8" opacity={0.08} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={28}
                tick={{ fontWeight: 900, fill: "#667085", fontSize: 12 }}
              />
              <YAxis
                width={46}
                tickLine={false}
                axisLine={false}
                tick={{ fontWeight: 900, fill: "#667085", fontSize: 12 }}
                tickFormatter={(value) => formatMoney(Number(value))}
              />
              <Tooltip
                formatter={(value: number, name: string) => [formatMoney(value), name === "basilBalance" ? "Basil" : "Osama"]}
                labelFormatter={(label) => `Trail stop: ${label}`}
                contentStyle={{
                  border: "none",
                  borderRadius: 8,
                  boxShadow: "0 16px 42px rgba(23, 32, 51, 0.16)",
                  fontWeight: 900
                }}
              />
              <Area
                type="monotone"
                dataKey="basilBalance"
                name="Basil"
                stroke="#2F7DF6"
                strokeWidth={5}
                fill="url(#basilTrail)"
                dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                activeDot={{ r: 8 }}
              />
              <Area
                type="monotone"
                dataKey="osamaBalance"
                name="Osama"
                stroke="#8E5CF7"
                strokeWidth={5}
                fill="url(#osamaTrail)"
                dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                activeDot={{ r: 8 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
