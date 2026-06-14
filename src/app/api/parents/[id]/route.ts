import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { hashPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";

export const preferredRegion = "hnd1";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  try {
    await requireAdminApi();
    const { id } = await context.params;
    const body = await request.json();
    const password = String(body.password ?? "");

    if (password.length < 4) {
      return NextResponse.json({ message: "Password must be at least 4 characters." }, { status: 400 });
    }

    await prisma.parent.update({
      where: { id },
      data: { passwordHash: hashPassword(password) }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not reset parent password." },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    await requireAdminApi();
    const { id } = await context.params;

    await prisma.parent.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not delete parent." },
      { status: 400 }
    );
  }
}
