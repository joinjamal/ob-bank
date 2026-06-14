import { NextResponse } from "next/server";
import { getKidDashboardData } from "@/lib/data";
import { defaultKidPin, hashKidPin, isValidPinFormat } from "@/lib/kidAuth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accountId = String(body.accountId ?? "");
    const pin = String(body.pin ?? "");

    if (!accountId || !isValidPinFormat(pin)) {
      return NextResponse.json({ message: "Choose a kid and enter a 4 digit PIN." }, { status: 400 });
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, pinHash: true }
    });

    if (!account) {
      return NextResponse.json({ message: "Kid account not found." }, { status: 404 });
    }

    const expectedHash = account.pinHash || hashKidPin(defaultKidPin);

    if (hashKidPin(pin) !== expectedHash) {
      return NextResponse.json({ message: "That PIN did not match." }, { status: 401 });
    }

    if (!account.pinHash) {
      await prisma.account.update({
        where: { id: accountId },
        data: { pinHash: hashKidPin(defaultKidPin) }
      });
    }

    return NextResponse.json(await getKidDashboardData(accountId));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not sign in." },
      { status: 400 }
    );
  }
}
