import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeAccount } from "@/lib/serializers";

export async function GET() {
  const accounts = await prisma.account.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(accounts.map(serializeAccount));
}
