import { NextResponse } from "next/server";
import { requireParentApi } from "@/lib/parentApi";
import { hashSecret } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";

export const preferredRegion = "hnd1";

export async function POST(request: Request) {
  try {
    const parent = await requireParentApi();
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase() || null;
    const password = String(body.password ?? "");

    if (!name || name.length > 48 || password.length < 6) {
      return NextResponse.json({ message: "Choose a parent name and a password of at least 6 characters." }, { status: 400 });
    }

    const created = await prisma.parent.create({
      data: {
        familyId: parent.familyId,
        name,
        email,
        passwordHash: hashSecret(password),
        emailVerifiedAt: email ? null : new Date()
      },
      select: { id: true, familyId: true, name: true, email: true }
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not add parent.";
    return NextResponse.json(
      { message: message.includes("Unique constraint") ? "That email is already registered." : message },
      { status: 400 }
    );
  }
}
