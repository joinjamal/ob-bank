import "server-only";

import { cookies } from "next/headers";
import { parentCookieName, readParentSession, readParentSessionToken } from "@/lib/parentAuth";
import { prisma } from "@/lib/prisma";

export async function requireParentApi() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(parentCookieName())?.value;
  const parentId = readParentSession(cookieValue);

  if (parentId) {
    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
      select: { id: true, familyId: true, name: true }
    });

    if (!parent) {
      throw new Error("Parent access is required.");
    }

    return parent;
  }

  const tokenParent = await readParentSessionToken(cookieValue);

  if (!tokenParent) {
    throw new Error("Parent access is required.");
  }

  return tokenParent;
}
