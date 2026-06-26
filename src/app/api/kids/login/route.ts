import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readDeviceFamilyIdOrDefault } from "@/lib/familySession";
import { defaultKidPin, hashKidPin, isValidPinFormat, needsKidPinRehash, verifyKidPin } from "@/lib/kidAuth";
import { kidCookieName, signKidSession } from "@/lib/kidSession";
import { prisma } from "@/lib/prisma";
import { serializeAccount } from "@/lib/serializers";

export const preferredRegion = "hnd1";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accountId = String(body.accountId ?? "");
    const pin = String(body.pin ?? "");
    const remember = Boolean(body.remember);
    const familyId = await readDeviceFamilyIdOrDefault();

    if (!accountId || !isValidPinFormat(pin)) {
      return NextResponse.json({ message: "Choose a kid and enter a 4 digit PIN." }, { status: 400 });
    }

    if (!familyId) {
      return NextResponse.json({ message: "Ask a parent to sign in on this device first." }, { status: 401 });
    }

    const account = await prisma.account.findUnique({ where: { id: accountId } });

    if (!account || account.familyId !== familyId) {
      return NextResponse.json({ message: "Kid account not found." }, { status: 404 });
    }

    const validPin = account.pinHash ? verifyKidPin(pin, account.pinHash) : pin === defaultKidPin;

    if (!validPin) {
      return NextResponse.json({ message: "That PIN did not match." }, { status: 401 });
    }

    if (account.pinHash && needsKidPinRehash(account.pinHash)) {
      void prisma.account.update({
        where: { id: account.id },
        data: { pinHash: hashKidPin(pin) }
      }).catch(() => undefined);
    }

    const cookieStore = await cookies();
    cookieStore.set(kidCookieName(), signKidSession(account.id, familyId), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: remember ? 60 * 60 * 24 * 90 : 60 * 60
    });

    return NextResponse.json({
      account: serializeAccount(account),
      transactions: [],
      ledger: []
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not sign in." },
      { status: 400 }
    );
  }
}
