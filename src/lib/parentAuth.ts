import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { hashToken } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "ob_bank_parent";
const FAMILY_COOKIE_NAME = "ob_bank_family";

export function parentCookieName() {
  return COOKIE_NAME;
}

export function familyCookieName() {
  return FAMILY_COOKIE_NAME;
}

function secret() {
  return process.env.PARENT_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

function sign(scope: string, id: string) {
  return createHmac("sha256", secret()).update(`${scope}:${id}`).digest("hex");
}

export function signParentSession(parentId: string) {
  return `${parentId}.${sign("parent", parentId)}`;
}

export function signFamilySession(familyId: string) {
  return `${familyId}.${sign("family", familyId)}`;
}

function readSignedSession(scope: string, value?: string) {
  if (!value || !secret()) return null;
  const [id, signature] = value.split(".");
  if (!id || !signature) return null;

  const expected = sign(scope, id);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  return id;
}

export function readParentSession(value?: string) {
  return readSignedSession("parent", value);
}

export function readFamilySession(value?: string) {
  return readSignedSession("family", value);
}

export async function createParentSession(parentId: string, maxAgeSeconds: number) {
  const token = createSessionToken();
  await prisma.parentSession.create({
    data: {
      parentId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + maxAgeSeconds * 1000)
    }
  });
  return token;
}

export async function readParentSessionToken(value?: string) {
  if (!value) return null;
  const session = await prisma.parentSession.findUnique({
    where: { tokenHash: hashToken(value) },
    include: { parent: { select: { id: true, familyId: true, name: true } } }
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.parentSession.delete({ where: { id: session.id } }).catch(() => null);
    }
    return null;
  }

  return session.parent;
}

export async function revokeParentSession(value?: string) {
  if (!value) return;
  await prisma.parentSession.deleteMany({ where: { tokenHash: hashToken(value) } });
}
