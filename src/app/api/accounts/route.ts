import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { getAccounts } from "@/lib/data";
import { defaultKidPin, hashKidPin, isValidPinFormat } from "@/lib/kidAuth";
import { prisma } from "@/lib/prisma";
import { serializeAccount } from "@/lib/serializers";

export const preferredRegion = "hnd1";

export async function GET() {
  return NextResponse.json(await getAccounts());
}

const profileColors = ["#DCEBFF", "#ECE4FF", "#D9FBEA", "#FFF0BE", "#FFE3DD"];
const themeColors = ["#2F7DF6", "#8E5CF7", "#3DCC91", "#E6A400", "#FF765F"];

export async function POST(request: Request) {
  try {
    await requireAdminApi();
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const pin = String(body.pin ?? defaultKidPin);

    if (!name || name.length > 32) {
      return NextResponse.json({ message: "Enter a kid name up to 32 characters." }, { status: 400 });
    }

    if (!isValidPinFormat(pin)) {
      return NextResponse.json({ message: "PIN must be 4 to 8 digits." }, { status: 400 });
    }

    const seed = encodeURIComponent(name);
    const existingCount = await prisma.account.count();
    const account = await prisma.account.create({
      data: {
        name,
        avatarUrl: `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
        currentBalance: 0,
        themeColor: themeColors[existingCount % themeColors.length],
        profileColor: profileColors[existingCount % profileColors.length],
        profilePattern: "soft",
        pinHash: hashKidPin(pin)
      }
    });

    return NextResponse.json(serializeAccount(account), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not create kid." },
      { status: 400 }
    );
  }
}
