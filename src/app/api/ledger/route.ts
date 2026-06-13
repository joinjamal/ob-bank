import { NextResponse } from "next/server";
import { buildWealthTrailFromTransactions } from "@/lib/ledger";

export async function GET() {
  const rows = await buildWealthTrailFromTransactions();
  return NextResponse.json(rows);
}
