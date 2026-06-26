import "server-only";

import { cookies } from "next/headers";
import { kidCookieName, readKidSession } from "@/lib/kidSession";
import { familyCookieName, parentCookieName, readFamilySession, readParentSession, readParentSessionToken } from "@/lib/parentAuth";
import { prisma } from "@/lib/prisma";

export async function readDeviceFamilyId() {
  const cookieStore = await cookies();

  const parentCookie = cookieStore.get(parentCookieName())?.value;
  const tokenParent = await readParentSessionToken(parentCookie);
  if (tokenParent) return tokenParent.familyId;

  const parentId = readParentSession(parentCookie);
  if (parentId) {
    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
      select: { familyId: true }
    });
    if (parent) return parent.familyId;
  }

  const kidSession = readKidSession(cookieStore.get(kidCookieName())?.value);
  if (kidSession) return kidSession.familyId;

  const familyId = readFamilySession(cookieStore.get(familyCookieName())?.value);
  if (!familyId) return null;

  const family = await prisma.family.findUnique({
    where: { id: familyId },
    select: { id: true }
  });

  return family?.id ?? null;
}

export async function readDeviceFamilyIdOrDefault() {
  const familyId = await readDeviceFamilyId();
  if (familyId) return familyId;

  const family = await prisma.family.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true }
  });

  return family?.id ?? null;
}

export async function readRememberedKidSession() {
  const cookieStore = await cookies();
  const kidSession = readKidSession(cookieStore.get(kidCookieName())?.value);
  if (!kidSession) return null;

  const account = await prisma.account.findFirst({
    where: { id: kidSession.accountId, familyId: kidSession.familyId },
    select: { id: true, familyId: true }
  });

  return account ? kidSession : null;
}
