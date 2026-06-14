import "server-only";

import { cookies } from "next/headers";
import { parentCookieName, readParentSession } from "@/lib/parentAuth";
import { prisma } from "@/lib/prisma";

export async function requireParentApi() {
  const cookieStore = await cookies();
  const parentId = readParentSession(cookieStore.get(parentCookieName())?.value);

  if (!parentId) {
    throw new Error("Parent access is required.");
  }

  const parent = await prisma.parent.findUnique({
    where: { id: parentId },
    select: { id: true, familyId: true, name: true }
  });

  if (!parent) {
    throw new Error("Parent access is required.");
  }

  return parent;
}
