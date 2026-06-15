import { NextResponse } from "next/server";
import { requireParentApi } from "@/lib/parentApi";
import { hashSecret } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";

export const preferredRegion = "hnd1";

type Context = {
  params: Promise<{ id: string }>;
};

async function findFamilyParent(id: string, familyId: string) {
  return prisma.parent.findFirst({
    where: { id, familyId },
    select: { id: true, familyId: true, name: true }
  });
}

export async function PATCH(request: Request, context: Context) {
  try {
    const parent = await requireParentApi();
    const { id } = await context.params;
    const body = await request.json();
    const password = String(body.password ?? "");

    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters." }, { status: 400 });
    }

    const target = await findFamilyParent(id, parent.familyId);
    if (!target) {
      return NextResponse.json({ message: "Parent was not found in this family." }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.parent.update({ where: { id }, data: { passwordHash: hashSecret(password) } }),
      prisma.parentSession.deleteMany({ where: { parentId: id } })
    ]);

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
    const parent = await requireParentApi();
    const { id } = await context.params;
    const target = await findFamilyParent(id, parent.familyId);

    if (!target) {
      return NextResponse.json({ message: "Parent was not found in this family." }, { status: 404 });
    }

    const parentCount = await prisma.parent.count({ where: { familyId: parent.familyId } });
    if (parentCount <= 1) {
      return NextResponse.json({ message: "Keep at least one parent in the family." }, { status: 400 });
    }

    await prisma.parent.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not remove parent." },
      { status: 400 }
    );
  }
}
