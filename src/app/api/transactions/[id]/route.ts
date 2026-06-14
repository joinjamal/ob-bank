import { TransactionType } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  try {
    await requireAdminApi();
    const { id } = await context.params;
    const body = await request.json();
    const amount = Number(body.amount);
    const type = body.type === "Withdrawal" ? TransactionType.Withdrawal : TransactionType.Deposit;
    const reason = String(body.reason ?? "").trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ message: "Enter a positive amount." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findUnique({
        where: { id },
        select: { accountId: true, amount: true, type: true }
      });

      if (!existing) {
        throw new Error("Transaction not found.");
      }

      const oldSignedAmount = existing.type === TransactionType.Deposit ? Number(existing.amount) : -Number(existing.amount);
      const newSignedAmount = type === TransactionType.Deposit ? amount : -amount;
      const delta = newSignedAmount - oldSignedAmount;

      await tx.transaction.update({
        where: { id },
        data: { type, amount, reason }
      });

      await tx.account.update({
        where: { id: existing.accountId },
        data: {
          currentBalance: {
            increment: delta
          }
        }
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not update transaction." },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    await requireAdminApi();
    const { id } = await context.params;

    await prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findUnique({
        where: { id },
        select: { accountId: true, amount: true, type: true }
      });

      if (!existing) {
        throw new Error("Transaction not found.");
      }

      await tx.transaction.delete({ where: { id } });
      await tx.account.update({
        where: { id: existing.accountId },
        data: {
          currentBalance: {
            increment: existing.type === TransactionType.Deposit ? -Number(existing.amount) : Number(existing.amount)
          }
        }
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not delete transaction." },
      { status: 400 }
    );
  }
}
