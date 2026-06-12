"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { format } from "date-fns";
import { LedgerPoint } from "@/components/types";
import { formatMoney } from "@/lib/money";

export default function TrendChart({ data }: { data: LedgerPoint[] }) {
  const chartData = data.map((point) => ({
    ...point,
    label: format(new Date(point.date), "MMM d")
  }));

  return (
    <section className="rounded-[8px] bg-white p-5 shadow-lift">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Wealth trail</h2>
          <p className="text-sm font-bold text-ink/55">Balance growth over time.</p>
        </div>
        <div className="flex gap-3 text-sm font-black">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-basil" />
            Basil
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-osama" />
            Osama
          </span>
        </div>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#172033" strokeDasharray="4 6" opacity={0.08} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontWeight: 800, fill: "#667085" }} />
            <YAxis
              width={54}
              tickLine={false}
              axisLine={false}
              tick={{ fontWeight: 800, fill: "#667085" }}
              tickFormatter={(value) => String(value)}
            />
            <Tooltip
              formatter={(value: number) => formatMoney(value)}
              contentStyle={{
                border: "none",
                borderRadius: 8,
                boxShadow: "0 16px 42px rgba(23, 32, 51, 0.16)",
                fontWeight: 800
              }}
            />
            <Line
              type="monotone"
              dataKey="basilBalance"
              name="Basil"
              stroke="#2F7DF6"
              strokeWidth={4}
              dot={{ r: 5, strokeWidth: 2, fill: "#fff" }}
              activeDot={{ r: 7 }}
            />
            <Line
              type="monotone"
              dataKey="osamaBalance"
              name="Osama"
              stroke="#8E5CF7"
              strokeWidth={4}
              dot={{ r: 5, strokeWidth: 2, fill: "#fff" }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
