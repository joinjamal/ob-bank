import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "ob_bank_kid";

export function kidCookieName() {
  return COOKIE_NAME;
}

function secret() {
  return process.env.KID_SESSION_SECRET || process.env.PARENT_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function sign(accountId: string, familyId: string) {
  return createHmac("sha256", secret()).update(`kid:${accountId}:${familyId}`).digest("hex");
}

export function signKidSession(accountId: string, familyId: string) {
  return `${accountId}.${familyId}.${sign(accountId, familyId)}`;
}

export function readKidSession(value?: string) {
  if (!value || !secret()) return null;
  const [accountId, familyId, signature] = value.split(".");
  if (!accountId || !familyId || !signature) return null;

  const expected = sign(accountId, familyId);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  return { accountId, familyId };
}
