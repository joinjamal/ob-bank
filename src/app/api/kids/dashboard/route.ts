import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getKidDashboardData } from "@/lib/data";
import { kidCookieName, readKidSession } from "@/lib/kidSession";
import { runDueAllowances } from "@/lib/allowances";

export const preferredRegion = "hnd1";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = String(searchParams.get("accountId") ?? "");

    if (!accountId) {
      return NextResponse.json({ message: "Missing kid account." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const kidSession = readKidSession(cookieStore.get(kidCookieName())?.value);

    if (!kidSession || kidSession.accountId !== accountId) {
      return NextResponse.json({ message: "Open the vault with your PIN first." }, { status: 401 });
    }

    // Run any due automatic allowances
    await runDueAllowances(kidSession.familyId);

    return NextResponse.json(await getKidDashboardData(accountId));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not load kid data." },
      { status: 400 }
    );
  }
}

