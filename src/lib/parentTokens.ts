import "server-only";

import { createPlainToken, hashToken } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";

export async function createPasswordResetToken(parentId: string) {
  const token = createPlainToken();
  await prisma.parentPasswordReset.create({
    data: {
      parentId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    }
  });
  return token;
}

export async function createEmailVerificationToken(parentId: string) {
  const token = createPlainToken();
  await prisma.parentEmailVerification.create({
    data: {
      parentId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });
  return token;
}

export async function consumePasswordResetToken(token: string) {
  const reset = await prisma.parentPasswordReset.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, parentId: true, expiresAt: true, usedAt: true }
  });

  if (!reset || reset.usedAt || reset.expiresAt <= new Date()) return null;

  await prisma.parentPasswordReset.update({
    where: { id: reset.id },
    data: { usedAt: new Date() }
  });

  return reset.parentId;
}

export async function consumeEmailVerificationToken(token: string) {
  const verification = await prisma.parentEmailVerification.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, parentId: true, expiresAt: true, usedAt: true }
  });

  if (!verification || verification.usedAt || verification.expiresAt <= new Date()) return null;

  await prisma.$transaction([
    prisma.parentEmailVerification.update({
      where: { id: verification.id },
      data: { usedAt: new Date() }
    }),
    prisma.parent.update({
      where: { id: verification.parentId },
      data: { emailVerifiedAt: new Date() }
    })
  ]);

  return verification.parentId;
}
