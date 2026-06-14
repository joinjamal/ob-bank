import { TransactionType } from "@prisma/client";
import { NextResponse } from "next/server";
import { recalculateAccountBalance } from "@/lib/balances";
import { getTransactions } from "@/lib/data";
import { snapshotLedger } from "@/lib/ledger";
import { prisma } from "@/lib/prisma";
import { serializeTransaction } from "@/lib/serializers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit"));

  return NextResponse.json(await getTransactions(Number.isFinite(limit) && limit > 0 ? limit : undefined));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accountId = String(body.accountId ?? "");
    const type = body.type === "Withdrawal" ? TransactionType.Withdrawal : TransactionType.Deposit;
    const amount = Number(body.amount);
    const reason = String(body.reason ?? "").trim();

    if (!accountId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { message: "Choose a kid and enter a positive amount." },
        { status: 400 }
      );
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({ where: { id: accountId } });

      if (!account) {
        throw new Error("Account not found.");
      }

      const transaction = await tx.transaction.create({
        data: {
          account: { connect: { id: accountId } },
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

      await recalculateAccountBalance(tx, accountId);

      return transaction;
    });

    await snapshotLedger();

    return NextResponse.json(serializeTransaction(transaction), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not save the transaction." },
      { status: 400 }
    );
  }
}
