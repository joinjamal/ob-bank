import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const preferredRegion = "hnd1";

/**
 * Health-check endpoint that verifies the database connection is alive.
 * Used by the GitHub Actions keep-alive workflow to prevent Supabase
 * free-tier database pausing due to inactivity.
 */
export async function GET() {
  try {
    const result = await prisma.$queryRaw<[{ now: Date }]>`SELECT NOW() as now`;
    return NextResponse.json({
      status: "ok",
      timestamp: result[0].now,
      message: "Database connection is healthy."
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Database connection failed."
      },
      { status: 503 }
    );
  }
}
