import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { recalculateAccountBalance } from "@/lib/balances";
import { snapshotLedger } from "@/lib/ledger";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    await requireAdminApi();
    const body = await request.json();
    const ids = Array.isArray(body.ids) ? body.ids.map(String).filter(Boolean) : [];

    if (ids.length === 0) {
      return NextResponse.json({ message: "Select at least one transaction." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const transactions = await tx.transaction.findMany({
        where: { id: { in: ids } },
        select: { accountId: true }
      });
      const accountIds = Array.from(new Set(transactions.map((transaction) => transaction.accountId)));

      await tx.transaction.deleteMany({
        where: { id: { in: ids } }
      });

      for (const accountId of accountIds) {
        await recalculateAccountBalance(tx, accountId, { allowNegative: true });
      }
    });

    await snapshotLedger();
    return NextResponse.json({ ok: true, deleted: ids.length });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not delete selected transactions." },
      { status: 400 }
    );
  }
}
