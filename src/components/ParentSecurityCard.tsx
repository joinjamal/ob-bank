"use client";

import { Download, ShieldCheck } from "lucide-react";
import type { Transaction } from "@/components/types";

export default function ParentSecurityCard({
  transactions
}: {
  transactions: Transaction[];
}) {
  function exportCsv() {
    const header = "kid,date,type,amount,reason";
    const rows = transactions.map((transaction) =>
      [
        transaction.accountName,
        new Date(transaction.date).toISOString().slice(0, 10),
        transaction.type,
        transaction.amount,
        transaction.reason ?? ""
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ob-bank-family-export.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-[8px] bg-white p-5 shadow-lift">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mint/15 text-mint">
          <ShieldCheck size={21} />
        </div>
        <div>
          <h2 className="text-xl font-black">Account safety</h2>
          <p className="text-sm font-bold text-ink/55">Keep a local copy of the family ledger.</p>
        </div>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-ink font-black text-white transition hover:-translate-y-0.5"
        >
          <Download size={17} />
          Export family CSV
        </button>
      </div>

    </section>
  );
}
