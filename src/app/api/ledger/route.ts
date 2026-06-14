import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { buildWealthTrailFromTransactions } from "@/lib/ledger";

export const preferredRegion = "hnd1";

export async function GET() {
  try {
    await requireAdminApi();
    const rows = await buildWealthTrailFromTransactions();
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Admin access is required." },
      { status: 401 }
    );
  }
}
