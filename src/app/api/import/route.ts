import { TransactionType } from "@prisma/client";
import { NextResponse } from "next/server";
import Papa from "papaparse";
import { snapshotLedger } from "@/lib/ledger";
import { prisma } from "@/lib/prisma";

type CsvRow = {
  account?: string;
  name?: string;
  kid?: string;
  date?: string;
  type?: string;
  amount?: string;
  reason?: string;
};

export async function POST(request: Request) {
  const csv = await request.text();
  const parsed = Papa.parse<CsvRow>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase()
  });

  if (parsed.errors.length > 0) {
    return NextResponse.json({ message: parsed.errors[0].message }, { status: 400 });
  }

  let imported = 0;

  for (const row of parsed.data) {
    const accountName = row.account ?? row.name ?? row.kid;
    const amount = Number(row.amount);
    const reason = String(row.reason ?? "").trim();
    const type =
      String(row.type).toLowerCase().startsWith("w") || String(row.type).toLowerCase() === "remove"
        ? TransactionType.Withdrawal
        : TransactionType.Deposit;

    if (!accountName || !Number.isFinite(amount) || amount <= 0) {
      continue;
    }

    const account = await prisma.account.findFirst({
      where: { name: { equals: accountName, mode: "insensitive" } }
    });

    if (!account) {
      continue;
    }

    const delta = type === TransactionType.Deposit ? amount : -amount;

    await prisma.$transaction([
      prisma.account.update({
        where: { id: account.id },
        data: { currentBalance: { increment: delta } }
      }),
      prisma.transaction.create({
        data: {
          account: { connect: { id: account.id } },
          date: row.date ? new Date(row.date) : new Date(),
          type,
          amount,
          reason
        }
      })
    ]);

    imported += 1;
  }

  await snapshotLedger();

  return NextResponse.json({ imported });
}
