import { NextResponse } from "next/server";
import { getParentData } from "@/lib/data";
import { requireParentApi } from "@/lib/parentApi";
import { runDueAllowances } from "@/lib/allowances";

export const preferredRegion = "hnd1";

export async function GET() {
  try {
    const parent = await requireParentApi();
    
    // Run any due automatic allowances — don't block dashboard if this fails
    try {
      await runDueAllowances(parent.familyId);
    } catch {
      // Allowance run failed — continue loading dashboard
    }

    return NextResponse.json(await getParentData(parent.id));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not load parent data." },
      { status: 401 }
    );
  }
}

