"use client";

import { FormEvent, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Pencil, Save, Trash2, X } from "lucide-react";
import { deleteTransaction, updateTransaction } from "@/app/actions";
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

  function startEdit(transaction: Transaction) {
    setMessage("");
    setEditingId(transaction.id);
    setType(transaction.type);
    setAmount(String(transaction.amount));
    setReason(transaction.reason ?? "");
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;

    setMessage("");
    try {
      await updateTransaction(editingId, { type, amount: Number(amount), reason });
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
      await deleteTransaction(transactionId);
      await onChanged();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete transaction.");
    }
  }

  return (
    <section className="rounded-[8px] bg-white p-5 shadow-lift">
      <div className="mb-4">
        <h2 className="text-xl font-black">Manage activity</h2>
        <p className="text-sm font-bold text-ink/55">Edit or delete past entries. Balances recalculate automatically.</p>
      </div>
      {message && <p className="mb-3 rounded-[8px] bg-coral/10 px-3 py-2 text-sm font-bold text-coral">{message}</p>}
      <div className="max-h-[680px] space-y-3 overflow-y-auto pr-1">
        {transactions.map((transaction) => {
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
        })}
      </div>
    </section>
  );
}
