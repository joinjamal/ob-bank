import { NextResponse } from "next/server";
import { readFamilyAccessLinkId } from "@/lib/familyAccessLinks";
import { familyCookieName, readFamilySession, signFamilySession } from "@/lib/parentAuth";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{ token: string }>;
};

export async function GET(request: Request, context: Context) {
  const { token } = await context.params;
  const decodedToken = decodeURIComponent(token);
  const linkId = readFamilyAccessLinkId(decodedToken);
  const legacyFamilyId = readFamilySession(decodedToken);
  const redirectUrl = new URL("/", request.url);

  const family = linkId
    ? await prisma.familyAccessLink
        .update({
          where: { id: linkId },
          data: { lastUsedAt: new Date() },
          select: {
            active: true,
            expiresAt: true,
            family: { select: { id: true } }
          }
        })
        .catch(() => null)
    : legacyFamilyId
      ? { active: true, expiresAt: null, family: await prisma.family.findUnique({ where: { id: legacyFamilyId }, select: { id: true } }) }
      : null;

  if (!family?.family || !family.active || (family.expiresAt && family.expiresAt <= new Date())) {
    redirectUrl.pathname = "/parent";
    return NextResponse.redirect(redirectUrl);
  }

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(familyCookieName(), signFamilySession(family.family.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180
  });

  return response;
}
