import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { hashToken } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";

function secret() {
  return process.env.FAMILY_LINK_SECRET || process.env.PARENT_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function linkSignature(linkId: string) {
  return createHmac("sha256", secret()).update(`family-link:${linkId}`).digest("hex");
}

export function familyAccessTokenFor(linkId: string) {
  return `${linkId}.${linkSignature(linkId)}`;
}

export function readFamilyAccessLinkId(token: string) {
  if (!token || !secret()) return null;
  const [linkId, signature] = token.split(".");
  if (!linkId || !signature) return null;

  const expected = linkSignature(linkId);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  return linkId;
}

export async function ensureFamilyAccessLink(familyId: string) {
  const existing = await prisma.familyAccessLink.findFirst({
    where: {
      familyId,
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
    },
    orderBy: { createdAt: "desc" }
  });

  if (existing) return { link: existing, token: familyAccessTokenFor(existing.id) };

  const link = await prisma.familyAccessLink.create({
    data: {
      familyId,
      tokenHash: "pending"
    }
  });
  const token = familyAccessTokenFor(link.id);
  const updated = await prisma.familyAccessLink.update({
    where: { id: link.id },
    data: { tokenHash: hashToken(token) }
  });

  return { link: updated, token };
}

export async function rotateFamilyAccessLink(familyId: string) {
  await prisma.familyAccessLink.updateMany({
    where: { familyId, active: true },
    data: { active: false }
  });
  return ensureFamilyAccessLink(familyId);
}
