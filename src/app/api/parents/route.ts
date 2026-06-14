import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { hashPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";

export const preferredRegion = "hnd1";

export async function POST(request: Request) {
  try {
    await requireAdminApi();
    const body = await request.json();
    const familyId = String(body.familyId ?? "");
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase() || null;
    const password = String(body.password ?? "password");

    if (!familyId || !name || name.length > 48 || password.length < 4) {
      return NextResponse.json({ message: "Choose a family, name, and password." }, { status: 400 });
    }

    const parent = await prisma.parent.create({
      data: {
        family: { connect: { id: familyId } },
        name,
        email,
        passwordHash: hashPassword(password)
      }
    });

    return NextResponse.json({ id: parent.id, familyId: parent.familyId, name: parent.name, email: parent.email }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not create parent." },
      { status: 400 }
    );
  }
}
