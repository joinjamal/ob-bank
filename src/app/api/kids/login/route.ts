import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getKidDashboardData } from "@/lib/data";
import { readDeviceFamilyId } from "@/lib/familySession";
import { defaultKidPin, hashKidPin, isValidPinFormat } from "@/lib/kidAuth";
import { kidCookieName, signKidSession } from "@/lib/kidSession";
import { prisma } from "@/lib/prisma";

export const preferredRegion = "hnd1";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accountId = String(body.accountId ?? "");
    const pin = String(body.pin ?? "");
    const remember = Boolean(body.remember);
    const familyId = await readDeviceFamilyId();

    if (!accountId || !isValidPinFormat(pin)) {
      return NextResponse.json({ message: "Choose a kid and enter a 4 digit PIN." }, { status: 400 });
    }

    if (!familyId) {
      return NextResponse.json({ message: "Ask a parent to sign in on this device first." }, { status: 401 });
    }

    const account = await prisma.account.findFirst({ where: { id: accountId, familyId } });

    if (!account) {
      return NextResponse.json({ message: "Kid account not found." }, { status: 404 });
    }

    const expectedHash = account.pinHash || hashKidPin(defaultKidPin);

    if (hashKidPin(pin) !== expectedHash) {
      return NextResponse.json({ message: "That PIN did not match." }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set(kidCookieName(), signKidSession(account.id, familyId), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: remember ? 60 * 60 * 24 * 90 : 60 * 60
    });

    return NextResponse.json(await getKidDashboardData(account.id));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not sign in." },
      { status: 400 }
    );
  }
}
