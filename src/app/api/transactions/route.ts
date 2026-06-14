import { TransactionType } from "@prisma/client";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAdminApi } from "@/lib/adminApi";
import { getTransactions } from "@/lib/data";
import { kidCookieName, readKidSession } from "@/lib/kidSession";
import { prisma } from "@/lib/prisma";
import { serializeTransaction } from "@/lib/serializers";

export const preferredRegion = "hnd1";

export async function GET(request: Request) {
  try {
    await requireAdminApi();
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Admin access is required." },
      { status: 401 }
    );
  }

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

    const cookieStore = await cookies();
    const kidSession = readKidSession(cookieStore.get(kidCookieName())?.value);

    if (!kidSession || kidSession.accountId !== accountId) {
      return NextResponse.json({ message: "Open the vault with your PIN first." }, { status: 401 });
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({ where: { id: accountId, familyId: kidSession.familyId } });

      if (!account) {
        throw new Error("Account not found.");
      }

      const delta = type === TransactionType.Deposit ? amount : -amount;

      if (Number(account.currentBalance) + delta < 0) {
        throw new Error("This change would make the balance negative.");
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

      await tx.account.update({
        where: { id: accountId },
        data: {
          currentBalance: {
            increment: delta
          }
        }
      });

      return transaction;
    });

    return NextResponse.json({ transaction: serializeTransaction(transaction) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not save the transaction." },
      { status: 400 }
    );
  }
}
