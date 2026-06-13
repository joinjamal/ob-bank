"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Download,
  Filter,
  Pencil,
  Save,
  Search,
  Trash2,
  X
} from "lucide-react";
import { Transaction } from "@/components/types";
import { formatMoney } from "@/lib/money";

export default function AdminTransactionList({
  transactions,
  onChanged
}: {
  transactions: Transaction[];
  onChanged: () => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<"Deposit" | "Withdrawal">("Deposit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [query, setQuery] = useState("");
  const [kidFilter, setKidFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const kidNames = useMemo(
    () => Array.from(new Set(transactions.map((transaction) => transaction.accountName))).sort(),
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const normalizedQuery = query.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      const matchesQuery =
        !normalizedQuery ||
        transaction.reason?.toLowerCase().includes(normalizedQuery) ||
        transaction.accountName.toLowerCase().includes(normalizedQuery) ||
        String(transaction.amount).includes(normalizedQuery);
      const matchesKid = kidFilter === "all" || transaction.accountName === kidFilter;
      const matchesType = typeFilter === "all" || transaction.type === typeFilter;
      const matchesDate =
        dateFilter === "all" ||
        (dateFilter === "week" && transactionDate >= startOfWeek) ||
        (dateFilter === "month" && transactionDate >= startOfMonth);

      return matchesQuery && matchesKid && matchesType && matchesDate;
    });
  }, [dateFilter, kidFilter, query, transactions, typeFilter]);

  const allSelected = useMemo(
    () =>
      filteredTransactions.length > 0 &&
      filteredTransactions.every((transaction) => selectedIds.includes(transaction.id)),
    [filteredTransactions, selectedIds]
  );

  function startEdit(transaction: Transaction) {
    setMessage("");
    setEditingId(transaction.id);
    setType(transaction.type);
    setAmount(String(transaction.amount));
    setReason(transaction.reason ?? "");
  }

  function toggleSelected(transactionId: string) {
    setSelectedIds((current) =>
      current.includes(transactionId) ? current.filter((id) => id !== transactionId) : [...current, transactionId]
    );
  }

  function toggleAll() {
    const filteredIds = filteredTransactions.map((transaction) => transaction.id);
    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !filteredIds.includes(id))
        : Array.from(new Set([...current, ...filteredIds]))
    );
  }

  function clearFilters() {
    setQuery("");
    setKidFilter("all");
    setTypeFilter("all");
    setDateFilter("all");
  }

  function exportCsv() {
    const headers = ["kid", "date", "type", "amount", "reason"];
    const rows = filteredTransactions.map((transaction) =>
      [
        transaction.accountName,
        new Date(transaction.date).toISOString().slice(0, 10),
        transaction.type,
        transaction.amount,
        transaction.reason ?? ""
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(",")
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ob-bank-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;

    setMessage("");
    try {
      const response = await fetch(`/api/transactions/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, amount: Number(amount), reason })
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.message ?? "Could not update transaction.");
      }

      setEditingId(null);
      await onChanged();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update transaction.");
    }
  }

  async function handleDelete(transactionId: string) {
    if (!window.confirm("Delete this transaction and recalculate the balance?")) return;

    setMessage("");
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, { method: "DELETE" });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.message ?? "Could not delete transaction.");
      }

      setSelectedIds((current) => current.filter((id) => id !== transactionId));
      await onChanged();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete transaction.");
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) {
      setMessage("Select at least one transaction.");
      return;
    }

    if (
      !window.confirm(
        `Delete ${selectedIds.length} selected transaction${selectedIds.length === 1 ? "" : "s"} and recalculate balances?`
      )
    ) {
      return;
    }

    setMessage("");
    setIsDeleting(true);
    try {
      const response = await fetch("/api/transactions/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds })
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.message ?? "Could not delete selected transactions.");
      }

      setSelectedIds([]);
      await onChanged();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete selected transactions.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="rounded-[8px] bg-white p-5 shadow-lift">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black">Manage activity</h2>
          <p className="text-sm font-bold text-ink/55">Edit or delete entries. Balances recalculate automatically.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={toggleAll}
            disabled={filteredTransactions.length === 0}
            className="h-10 rounded-[8px] bg-ink/5 px-3 text-sm font-black text-ink transition hover:bg-ink/10"
          >
            {allSelected ? "Clear filtered" : "Select filtered"}
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={filteredTransactions.length === 0}
            className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-ink/5 px-3 text-sm font-black text-ink transition hover:bg-ink/10 disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={selectedIds.length === 0 || isDeleting}
            className="h-10 rounded-[8px] bg-coral px-3 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete selected ({selectedIds.length})
          </button>
        </div>
      </div>
      <div className="mb-4 grid gap-2 lg:grid-cols-[1fr_140px_140px_140px_auto]">
        <label className="relative block">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search reason, kid, or amount"
            className="h-11 w-full rounded-[8px] border-2 border-ink/10 bg-white pl-9 pr-3 font-bold outline-none focus:border-mint"
          />
        </label>
        <select
          value={kidFilter}
          onChange={(event) => setKidFilter(event.target.value)}
          className="h-11 rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint"
        >
          <option value="all">All kids</option>
          {kidNames.map((kidName) => (
            <option key={kidName} value={kidName}>
              {kidName}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="h-11 rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint"
        >
          <option value="all">All types</option>
          <option value="Deposit">Deposits</option>
          <option value="Withdrawal">Withdrawals</option>
        </select>
        <select
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          className="h-11 rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint"
        >
          <option value="all">All dates</option>
          <option value="week">Last 7 days</option>
          <option value="month">This month</option>
        </select>
        <button
          type="button"
          onClick={clearFilters}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-ink px-3 text-sm font-black text-white transition hover:-translate-y-0.5"
        >
          <Filter size={16} />
          Clear
        </button>
      </div>
      <p className="mb-3 text-sm font-bold text-ink/50">
        Showing {filteredTransactions.length} of {transactions.length} entries.
      </p>
      {message && <p className="mb-3 rounded-[8px] bg-coral/10 px-3 py-2 text-sm font-bold text-coral">{message}</p>}
      <div className="max-h-[680px] space-y-3 overflow-y-auto pr-1">
        {filteredTransactions.length === 0 ? (
          <p className="rounded-[8px] bg-ink/5 p-4 text-sm font-bold text-ink/55">
            No entries match those filters.
          </p>
        ) : (
          filteredTransactions.map((transaction) => {
          const isDeposit = transaction.type === "Deposit";
          const Icon = isDeposit ? ArrowUpCircle : ArrowDownCircle;
          const isEditing = editingId === transaction.id;

          return (
            <article key={transaction.id} className="rounded-[8px] border border-ink/5 bg-white p-3 shadow-sm">
              {isEditing ? (
                <form onSubmit={handleSave} className="grid gap-3 md:grid-cols-[140px_120px_1fr_auto] md:items-center">
                  <select
                    value={type}
                    onChange={(event) => setType(event.target.value as "Deposit" | "Withdrawal")}
                    className="h-11 rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint"
                  >
                    <option value="Deposit">Deposit</option>
                    <option value="Withdrawal">Withdrawal</option>
                  </select>
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    inputMode="decimal"
                    className="h-11 rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint"
                  />
                  <input
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Reason"
                    className="h-11 rounded-[8px] border-2 border-ink/10 bg-white px-3 font-bold outline-none focus:border-mint"
                  />
                  <div className="flex gap-2">
                    <button className="grid h-11 w-11 place-items-center rounded-[8px] bg-mint text-white">
                      <Save size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="grid h-11 w-11 place-items-center rounded-[8px] bg-ink/10 text-ink"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(transaction.id)}
                    onChange={() => toggleSelected(transaction.id)}
                    className="h-5 w-5 accent-mint"
                    aria-label={`Select ${transaction.reason || "transaction"}`}
                  />
                  <div
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
                      isDeposit ? "bg-mint/15 text-mint" : "bg-coral/15 text-coral"
                    }`}
                  >
                    <Icon size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black">{transaction.reason || "Quick balance update"}</p>
                    <p className="text-sm font-bold text-ink/50">
                      {transaction.accountName} - {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                  <p className={`text-lg font-black ${isDeposit ? "text-mint" : "text-coral"}`}>
                    {isDeposit ? "+" : "-"}
                    {formatMoney(transaction.amount)}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(transaction)}
                      className="grid h-10 w-10 place-items-center rounded-[8px] bg-ink/10 text-ink transition hover:bg-mint hover:text-white"
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(transaction.id)}
                      className="grid h-10 w-10 place-items-center rounded-[8px] bg-coral/10 text-coral transition hover:bg-coral hover:text-white"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })
        )}
      </div>
    </section>
  );
}
