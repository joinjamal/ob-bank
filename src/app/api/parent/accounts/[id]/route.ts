import { NextResponse } from "next/server";
import { hashKidPin, isValidPinFormat } from "@/lib/kidAuth";
import { requireParentApi } from "@/lib/parentApi";
import { prisma } from "@/lib/prisma";
import { serializeAccount } from "@/lib/serializers";

export const preferredRegion = "hnd1";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  try {
    const parent = await requireParentApi();
    const { id } = await context.params;
    const body = await request.json();
    const pin = String(body.pin ?? "");

    if (!isValidPinFormat(pin)) {
      return NextResponse.json({ message: "PIN must be 4 to 8 digits." }, { status: 400 });
    }

    const existing = await prisma.account.findFirst({ where: { id, familyId: parent.familyId }, select: { id: true } });

    if (!existing) {
      return NextResponse.json({ message: "Kid not found in your family." }, { status: 404 });
    }

    const account = await prisma.account.update({
      where: { id },
      data: { pinHash: hashKidPin(pin) }
    });

    return NextResponse.json(serializeAccount(account));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not update kid." },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const parent = await requireParentApi();
    const { id } = await context.params;

    const existing = await prisma.account.findFirst({ where: { id, familyId: parent.familyId }, select: { id: true } });

    if (!existing) {
      return NextResponse.json({ message: "Kid not found in your family." }, { status: 404 });
    }

    await prisma.account.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not remove kid." },
      { status: 400 }
    );
  }
}
