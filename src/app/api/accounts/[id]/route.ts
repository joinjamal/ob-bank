import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { hashKidPin, isValidPinFormat } from "@/lib/kidAuth";
import { prisma } from "@/lib/prisma";
import { serializeAccount } from "@/lib/serializers";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  try {
    await requireAdminApi();
    const { id } = await context.params;
    const body = await request.json();
    const pin = String(body.pin ?? "");

    if (!isValidPinFormat(pin)) {
      return NextResponse.json({ message: "PIN must be 4 to 8 digits." }, { status: 400 });
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
    await requireAdminApi();
    const { id } = await context.params;

    await prisma.account.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not remove kid." },
      { status: 400 }
    );
  }
}
