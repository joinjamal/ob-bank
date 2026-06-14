import { NextResponse } from "next/server";
import { hashKidPin, isValidPinFormat } from "@/lib/kidAuth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accountId = String(body.accountId ?? "");
    const currentPin = String(body.currentPin ?? "");
    const newPin = String(body.newPin ?? "");

    if (!accountId || !isValidPinFormat(currentPin) || !isValidPinFormat(newPin)) {
      return NextResponse.json({ message: "PINs must be 4 to 8 digits." }, { status: 400 });
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { pinHash: true }
    });

    if (!account || hashKidPin(currentPin) !== account.pinHash) {
      return NextResponse.json({ message: "Current PIN did not match." }, { status: 401 });
    }

    await prisma.account.update({
      where: { id: accountId },
      data: { pinHash: hashKidPin(newPin) }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not update PIN." },
      { status: 400 }
    );
  }
}
