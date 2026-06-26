import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getKidQuickDashboardData } from "@/lib/data";
import { readDeviceFamilyIdOrDefault } from "@/lib/familySession";
import { defaultKidPin, isValidPinFormat, verifyKidPin } from "@/lib/kidAuth";
import { kidCookieName, signKidSession } from "@/lib/kidSession";
import { prisma } from "@/lib/prisma";

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

    const account = await prisma.account.findFirst({ where: { id: accountId, familyId } });

    if (!account) {
      return NextResponse.json({ message: "Kid account not found." }, { status: 404 });
    }

    const lockWindow = new Date(Date.now() - 10 * 60 * 1000);
    const failedAttempts = await prisma.kidPinAttempt.count({
      where: {
        accountId: account.id,
        success: false,
        createdAt: { gte: lockWindow }
      }
    });

    if (failedAttempts >= 5) {
      return NextResponse.json({ message: "Too many wrong tries. Wait 10 minutes and try again." }, { status: 429 });
    }

    const validPin = account.pinHash ? verifyKidPin(pin, account.pinHash) : pin === defaultKidPin;

    await prisma.kidPinAttempt.create({
      data: {
        accountId: account.id,
        familyId,
        success: validPin
      }
    });

    if (!validPin) {
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

    return NextResponse.json(await getKidQuickDashboardData(account.id));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not sign in." },
      { status: 400 }
    );
  }
}
