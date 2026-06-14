import { NextResponse } from "next/server";
import { getGameScores } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId") ?? undefined;

  return NextResponse.json(await getGameScores(accountId));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accountId = String(body.accountId ?? "");
    const mode = String(body.mode ?? "solo").slice(0, 24);
    const score = Math.max(0, Math.round(Number(body.score)));
    const coins = Math.max(0, Math.round(Number(body.coins ?? 0)));

    if (!accountId || !Number.isFinite(score)) {
      return NextResponse.json({ message: "Missing score details." }, { status: 400 });
    }

    await prisma.gameScore.create({
      data: {
        account: { connect: { id: accountId } },
        mode,
        score,
        coins
      }
    });

    return NextResponse.json(await getGameScores());
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not save score." },
      { status: 400 }
    );
  }
}
