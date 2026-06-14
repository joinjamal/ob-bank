import { TransactionType } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireParentApi } from "@/lib/parentApi";
import { prisma } from "@/lib/prisma";
import { serializeTransaction } from "@/lib/serializers";

export const preferredRegion = "hnd1";

export async function POST(request: Request) {
  try {
    const parent = await requireParentApi();
    const body = await request.json();
    const accountId = String(body.accountId ?? "");
    const type = body.type === "Withdrawal" ? TransactionType.Withdrawal : TransactionType.Deposit;
    const amount = Number(body.amount);
    const reason = String(body.reason ?? "").trim();

    if (!accountId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ message: "Choose a kid and enter a positive amount." }, { status: 400 });
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({
        where: { id: accountId, familyId: parent.familyId }
      });

      if (!account) {
        throw new Error("Kid account not found for this family.");
      }

      const delta = type === TransactionType.Deposit ? amount : -amount;

      if (Number(account.currentBalance) + delta < 0) {
        throw new Error("This change would make the balance negative.");
      }

      const created = await tx.transaction.create({
        data: {
          account: { connect: { id: account.id } },
          type,
          amount,
          reason,
          date: new Date()
        },
        include: {
          account: {
            select: {
              id: true,
              name: true,
              themeColor: true
            }
          }
        }
      });

      await tx.account.update({
        where: { id: account.id },
        data: {
          currentBalance: {
            increment: delta
          }
        }
      });

      return created;
    });

    return NextResponse.json({ transaction: serializeTransaction(transaction) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not save the transaction." },
      { status: 400 }
    );
  }
}
