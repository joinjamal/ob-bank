import { TransactionType } from "@prisma/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import Papa from "papaparse";
import { adminCookieName, isValidAdminSession } from "@/lib/adminAuth";
import { recalculateAccountBalance } from "@/lib/balances";
import { snapshotLedger } from "@/lib/ledger";
import { prisma } from "@/lib/prisma";

export const preferredRegion = "hnd1";

type CsvRow = {
  account?: string;
  name?: string;
  kid?: string;
  date?: string;
  type?: string;
  amount?: string;
  reason?: string;
};

function parseCsvDate(value?: string) {
  const raw = String(value ?? "").trim();
  if (!raw) return new Date();

  const dayFirstMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dayFirstMatch) {
    const [, day, month, year] = dayFirstMatch;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${raw}. Use YYYY-MM-DD or DD/MM/YYYY.`);
  }

  return parsed;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get(adminCookieName())?.value;

  if (!isValidAdminSession(session)) {
    return NextResponse.json({ message: "Admin access is required." }, { status: 401 });
  }

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

  for (let index = 0; index < parsed.data.length; index += 1) {
    const row = parsed.data[index];
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

    await prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          account: { connect: { id: account.id } },
          date: parseCsvDate(row.date),
          type,
          amount,
          reason
        }
      });

      await recalculateAccountBalance(tx, account.id);
    }).catch((error) => {
      throw new Error(`Row ${index + 2}: ${error instanceof Error ? error.message : "Import failed."}`);
    });

    imported += 1;
  }

  await snapshotLedger();

  return NextResponse.json({ imported });
}
