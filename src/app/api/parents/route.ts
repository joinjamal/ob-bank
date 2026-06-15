import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { hashSecret } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";

export const preferredRegion = "hnd1";

export async function POST(request: Request) {
  try {
    await requireAdminApi();
    const body = await request.json();
    const familyId = String(body.familyId ?? "");
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase() || null;
    const password = String(body.password ?? "");

    if (!familyId || !name || name.length > 48 || password.length < 6) {
      return NextResponse.json({ message: "Choose a family, name, and password of at least 6 characters." }, { status: 400 });
    }

    const parent = await prisma.parent.create({
      data: {
        family: { connect: { id: familyId } },
        name,
        email,
        passwordHash: hashSecret(password)
      }
    });

    return NextResponse.json({ id: parent.id, familyId: parent.familyId, name: parent.name, email: parent.email }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create parent.";
    return NextResponse.json(
      { message: message.includes("Unique constraint") ? "That email is already registered." : message },
      { status: 400 }
    );
  }
}
