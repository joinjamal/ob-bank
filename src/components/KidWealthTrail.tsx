"use client";

import { format } from "date-fns";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import { Account } from "@/components/types";
import { useI18n } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";

type KidLedgerPoint = {
  id: string;
  date: string;
  balance: number;
};

export default function KidWealthTrail({
  account,
  data
}: {
  account: Account;
  data: KidLedgerPoint[];
}) {
  const { t } = useI18n();
  const chartData = data.map((point) => ({
    ...point,
    label: format(new Date(point.date), "MMM d")
  }));
  const first = data[0]?.balance ?? account.currentBalance;
  const last = data[data.length - 1]?.balance ?? account.currentBalance;
  const change = last - first;

  return (
    <section className="surface-card overflow-hidden">
      <div
        className="kid-color-surface p-5"
        style={{ backgroundColor: account.profileColor, "--kid-theme-color": account.themeColor } as React.CSSProperties}
      >
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-black text-ink shadow-sm">
          <TrendingUp size={16} className="text-mint" />
          {t("kidTrail.badge")}
        </div>
        <h2 className="text-2xl font-black text-ink">{t("kidTrail.title")}</h2>
        <p className={`mt-2 text-sm font-black ${change >= 0 ? "text-mint" : "text-coral"}`}>
          {t("kidTrail.fromFirst", {
            sign: change >= 0 ? "+" : "-",
            amount: formatMoney(Math.abs(change))
          })}
        </p>
      </div>
      <div className="h-72 p-4">
        {chartData.length === 0 ? (
          <div className="grid h-full place-items-center rounded-[8px] bg-ink/5 text-center font-bold text-ink/55">
            {t("kidTrail.empty")}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="kidTrail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={account.themeColor} stopOpacity={0.42} />
                  <stop offset="95%" stopColor={account.themeColor} stopOpacity={0.04} />
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
                formatter={(value: number) => [formatMoney(value), account.name]}
                labelFormatter={(label) => t("kidTrail.stop", { label: String(label) })}
                contentStyle={{
                  border: "none",
                  borderRadius: 8,
                  boxShadow: "0 16px 42px rgba(23, 32, 51, 0.16)",
                  fontWeight: 900
                }}
              />
              <Area
                type="monotone"
                dataKey="balance"
                name={account.name}
                stroke={account.themeColor}
                strokeWidth={5}
                fill="url(#kidTrail)"
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
