import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { getFamilies } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export const preferredRegion = "hnd1";

export async function GET() {
  try {
    await requireAdminApi();
    return NextResponse.json(await getFamilies());
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not load families." },
      { status: 401 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminApi();
    const body = await request.json();
    const name = String(body.name ?? "").trim();

    if (!name || name.length > 48) {
      return NextResponse.json({ message: "Enter a family name up to 48 characters." }, { status: 400 });
    }

    const family = await prisma.family.create({ data: { name } });
    return NextResponse.json(family, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not create family." },
      { status: 400 }
    );
  }
}
