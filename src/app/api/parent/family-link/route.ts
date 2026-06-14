import { NextResponse } from "next/server";
import { ensureFamilyAccessLink, rotateFamilyAccessLink } from "@/lib/familyAccessLinks";
import { requireParentApi } from "@/lib/parentApi";
import { prisma } from "@/lib/prisma";

export const preferredRegion = "hnd1";

export async function GET() {
  try {
    const parent = await requireParentApi();
    const familyAccess = await ensureFamilyAccessLink(parent.familyId);
    return NextResponse.json({
      id: familyAccess.link.id,
      token: familyAccess.token,
      active: familyAccess.link.active,
      lastUsedAt: familyAccess.link.lastUsedAt?.toISOString() ?? null
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not load family link." },
      { status: 401 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const parent = await requireParentApi();
    const body = await request.json().catch(() => ({}));
    const action = String(body.action ?? "rotate");

    if (action === "revoke") {
      await prisma.familyAccessLink.updateMany({
        where: { familyId: parent.familyId, active: true },
        data: { active: false }
      });
      return NextResponse.json({ ok: true, revoked: true });
    }

    const familyAccess = await rotateFamilyAccessLink(parent.familyId);
    return NextResponse.json({
      id: familyAccess.link.id,
      token: familyAccess.token,
      active: familyAccess.link.active,
      lastUsedAt: familyAccess.link.lastUsedAt?.toISOString() ?? null
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not update family link." },
      { status: 400 }
    );
  }
}
