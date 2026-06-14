import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "ob_bank_parent";

export function parentCookieName() {
  return COOKIE_NAME;
}

function secret() {
  return process.env.PARENT_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function sign(parentId: string) {
  return createHmac("sha256", secret()).update(`parent:${parentId}`).digest("hex");
}

export function signParentSession(parentId: string) {
  return `${parentId}.${sign(parentId)}`;
}

export function readParentSession(value?: string) {
  if (!value || !secret()) return null;
  const [parentId, signature] = value.split(".");
  if (!parentId || !signature) return null;

  const expected = sign(parentId);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  return parentId;
}
