import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { prisma } from "@/lib/prisma";

export const preferredRegion = "hnd1";

type Context = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: Context) {
  try {
    await requireAdminApi();
    const { id } = await context.params;

    await prisma.family.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not delete family." },
      { status: 400 }
    );
  }
}
