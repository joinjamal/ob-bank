import { TransactionType } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireParentApi } from "@/lib/parentApi";
import { prisma } from "@/lib/prisma";

export const preferredRegion = "hnd1";

export async function POST(request: Request) {
  try {
    const parent = await requireParentApi();
    const body = await request.json();
    const ids = Array.isArray(body.ids) ? body.ids.map(String).filter(Boolean) : [];

    if (ids.length === 0) {
      return NextResponse.json({ message: "Select at least one transaction." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const transactions = await tx.transaction.findMany({
        where: { id: { in: ids }, account: { familyId: parent.familyId } },
        select: { id: true, accountId: true, amount: true, type: true }
      });

      if (transactions.length !== ids.length) {
        throw new Error("Some selected transactions do not belong to this family.");
      }

      const deltas = transactions.reduce<Record<string, number>>((totals, transaction) => {
        const reversal =
          transaction.type === TransactionType.Deposit ? -Number(transaction.amount) : Number(transaction.amount);
        totals[transaction.accountId] = (totals[transaction.accountId] ?? 0) + reversal;
        return totals;
      }, {});

      await tx.transaction.deleteMany({
        where: { id: { in: transactions.map((transaction) => transaction.id) } }
      });

      for (const [accountId, delta] of Object.entries(deltas)) {
        await tx.account.update({
          where: { id: accountId },
          data: {
            currentBalance: {
              increment: delta
            }
          }
        });
      }
    });

    return NextResponse.json({ ok: true, deleted: ids.length });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not delete selected transactions." },
      { status: 400 }
    );
  }
}
