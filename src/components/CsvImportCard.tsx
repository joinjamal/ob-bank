"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { Upload } from "lucide-react";

export default function CsvImportCard({ onImported }: { onImported: () => Promise<void> }) {
  const [csv, setCsv] = useState("");
  const [message, setMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setCsv(await file.text());
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!csv.trim()) {
      setMessage("Paste CSV rows or choose a CSV file.");
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: csv
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.message ?? "Import failed.");
      }

      setCsv("");
      setMessage(`Imported ${body.imported} transaction${body.imported === 1 ? "" : "s"}.`);
      await onImported();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card p-5">
      <div className="mb-4">
        <h2 className="section-heading">Legacy CSV import</h2>
        <p className="section-copy">Headers: kid,date,type,amount,reason</p>
        <p className="mt-1 text-xs font-bold text-ink/45">
          Type accepts Deposit or Withdrawal. Use positive amounts, even for withdrawals.
        </p>
      </div>
      <input type="file" accept=".csv,text/csv" onChange={handleFileChange} className="mb-3 block w-full text-sm font-bold" />
      <textarea
        value={csv}
        onChange={(event) => setCsv(event.target.value)}
        rows={7}
        placeholder="kid,date,type,amount,reason&#10;Basil,2026-06-12,Deposit,25,Weekly allowance&#10;Osama,13/06/2026,Withdrawal,15,Book"
        className="w-full resize-y rounded-[8px] border-2 border-ink/10 bg-white p-3 font-mono text-sm outline-none transition focus:border-mint"
      />
      {message && <p className="mt-3 rounded-[8px] bg-ink/5 px-3 py-2 text-sm font-bold text-ink/65">{message}</p>}
      <button
        disabled={isImporting}
        className="action-button action-primary mt-4 w-full"
      >
        <Upload size={18} />
        {isImporting ? "Importing..." : "Import CSV"}
      </button>
    </form>
  );
}
