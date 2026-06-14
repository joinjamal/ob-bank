import { NextResponse } from "next/server";
import { getKidDashboardData } from "@/lib/data";

export const preferredRegion = "hnd1";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = String(searchParams.get("accountId") ?? "");

    if (!accountId) {
      return NextResponse.json({ message: "Missing kid account." }, { status: 400 });
    }

    return NextResponse.json(await getKidDashboardData(accountId));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not load kid data." },
      { status: 400 }
    );
  }
}
