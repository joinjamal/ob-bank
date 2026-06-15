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
import { useI18n } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";

export default function AdminTransactionList({
  transactions,
  onEdit,
  onDelete
}: {
  transactions: Transaction[];
  onEdit: (transactionId: string, payload: { type: "Deposit" | "Withdrawal"; amount: number; reason: string }) => Promise<void>;
  onDelete: (transactions: Transaction[]) => Promise<void>;
}) {
  const { t } = useI18n();
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
      await onEdit(editingId, { type, amount: Number(amount), reason });
      setEditingId(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("activity.updateError"));
    }
  }

  async function handleDelete(transaction: Transaction) {
    if (!window.confirm(t("activity.deleteConfirm"))) return;

    setMessage("");
    try {
      await onDelete([transaction]);
      setSelectedIds((current) => current.filter((id) => id !== transaction.id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("activity.deleteAria"));
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) {
      setMessage(t("activity.selectAtLeastOne"));
      return;
    }

    if (
      !window.confirm(
        t("activity.deleteSelectedConfirm", { count: selectedIds.length })
      )
    ) {
      return;
    }

    setMessage("");
    setIsDeleting(true);
    try {
      await onDelete(transactions.filter((transaction) => selectedIds.includes(transaction.id)));
      setSelectedIds([]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("activity.deleteSelected", { count: selectedIds.length }));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="surface-card p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="section-heading">{t("activity.title")}</h2>
          <p className="section-copy">{t("activity.fullSubtitle")}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={toggleAll}
            disabled={filteredTransactions.length === 0}
            className="action-button action-muted min-h-10 px-3 py-1"
          >
            {allSelected ? t("activity.clearFiltered") : t("activity.selectFiltered")}
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={filteredTransactions.length === 0}
            className="action-button action-muted min-h-10 px-3 py-1"
          >
            <Download size={16} />
            {t("common.exportCsv")}
          </button>
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={selectedIds.length === 0 || isDeleting}
            className={`action-button action-coral col-span-2 min-h-10 px-3 py-1 sm:col-span-1 ${
              selectedIds.length === 0 ? "hidden sm:block" : ""
            }`}
          >
            {t("activity.deleteSelected", { count: selectedIds.length })}
          </button>
        </div>
      </div>
      <div className="mb-3">
        <label className="relative block">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("activity.searchPlaceholder")}
            className="field-input h-11 pl-9 text-sm sm:text-base"
          />
        </label>
      </div>
      <details className="mb-4 rounded-[8px] bg-ink/5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-black text-ink">
          <span className="inline-flex items-center gap-2">
            <Filter size={15} />
            {t("activity.filters")}
          </span>
          <span className="text-xs text-ink/45">
            {[kidFilter, typeFilter, dateFilter].filter((value) => value !== "all").length || t("activity.noFilters")}
          </span>
        </summary>
        <div className="grid gap-2 border-t border-ink/5 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <select
            value={kidFilter}
            onChange={(event) => setKidFilter(event.target.value)}
            className="field-input h-10 text-sm"
          >
            <option value="all">{t("activity.allKids")}</option>
            {kidNames.map((kidName) => (
              <option key={kidName} value={kidName}>
                {kidName}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="field-input h-10 text-sm"
          >
            <option value="all">{t("activity.allTypes")}</option>
            <option value="Deposit">{t("activity.depositFilter")}</option>
            <option value="Withdrawal">{t("activity.withdrawalFilter")}</option>
          </select>
          <select
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            className="field-input h-10 text-sm"
          >
            <option value="all">{t("activity.allDates")}</option>
            <option value="week">{t("activity.last7")}</option>
            <option value="month">{t("activity.thisMonth")}</option>
          </select>
          <button
            type="button"
            onClick={clearFilters}
            className="action-button action-primary min-h-10 px-3 py-1"
          >
            {t("common.clear")}
          </button>
        </div>
      </details>
      <p className="mb-3 text-sm font-bold text-ink/50">
        {t("activity.showing", { shown: filteredTransactions.length, total: transactions.length })}
      </p>
      {message && <p className="mb-3 rounded-[8px] bg-coral/10 px-3 py-2 text-sm font-bold text-coral">{message}</p>}
      <div className="max-h-[680px] space-y-3 overflow-y-auto pr-1">
        {filteredTransactions.length === 0 ? (
          <p className="rounded-[8px] bg-ink/5 p-4 text-sm font-bold text-ink/55">
            {t("activity.noMatches")}
          </p>
        ) : (
          filteredTransactions.map((transaction) => {
          const isDeposit = transaction.type === "Deposit";
          const Icon = isDeposit ? ArrowUpCircle : ArrowDownCircle;
          const isEditing = editingId === transaction.id;

          return (
            <article key={transaction.id} className="quiet-card p-3">
              {isEditing ? (
                <form onSubmit={handleSave} className="grid gap-3 md:grid-cols-[140px_120px_1fr_auto] md:items-center">
                  <select
                    value={type}
                    onChange={(event) => setType(event.target.value as "Deposit" | "Withdrawal")}
                    className="field-input h-11"
                  >
                    <option value="Deposit">{t("transaction.deposit")}</option>
                    <option value="Withdrawal">{t("transaction.withdrawal")}</option>
                  </select>
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    inputMode="decimal"
                    className="field-input h-11"
                  />
                  <input
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder={t("transaction.reason")}
                    className="field-input h-11"
                  />
                  <div className="flex gap-2">
                    <button className="icon-button bg-mint text-white hover:bg-mint">
                      <Save size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="icon-button"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(transaction.id)}
                      onChange={() => toggleSelected(transaction.id)}
                      className="mt-3 h-5 w-5 accent-mint"
                      aria-label={transaction.reason || t("activity.balanceUpdateShort")}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <div
                          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
                            isDeposit ? "bg-mint/15 text-mint" : "bg-coral/15 text-coral"
                          }`}
                        >
                          <Icon size={22} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-black leading-tight">{transaction.reason || t("activity.balanceUpdateShort")}</p>
                          <p className="text-sm font-bold text-ink/50">
                            {transaction.accountName} · {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className={`whitespace-nowrap pt-2 text-right text-lg font-black ${isDeposit ? "text-mint" : "text-coral"}`}>
                      {isDeposit ? "+" : "-"}
                      {formatMoney(transaction.amount)}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-ink/5 pt-3">
                    <button
                      type="button"
                      onClick={() => startEdit(transaction)}
                      className="icon-button"
                      aria-label={t("activity.editAria")}
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(transaction)}
                      className="icon-button bg-coral/10 text-coral hover:bg-coral hover:text-white"
                      aria-label={t("activity.deleteAria")}
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
