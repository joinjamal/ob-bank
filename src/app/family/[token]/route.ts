import { NextResponse } from "next/server";
import { familyCookieName, readFamilySession, signFamilySession } from "@/lib/parentAuth";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{ token: string }>;
};

export async function GET(request: Request, context: Context) {
  const { token } = await context.params;
  const familyId = readFamilySession(decodeURIComponent(token));
  const redirectUrl = new URL("/", request.url);

  if (!familyId) {
    redirectUrl.pathname = "/parent";
    return NextResponse.redirect(redirectUrl);
  }

  const family = await prisma.family.findUnique({
    where: { id: familyId },
    select: { id: true }
  });

  if (!family) {
    redirectUrl.pathname = "/parent";
    return NextResponse.redirect(redirectUrl);
  }

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(familyCookieName(), signFamilySession(family.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180
  });

  return response;
}
