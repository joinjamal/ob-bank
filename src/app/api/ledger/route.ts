import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeLedger } from "@/lib/serializers";

export async function GET() {
  const rows = await prisma.historicalLedger.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json(rows.map(serializeLedger));
}
