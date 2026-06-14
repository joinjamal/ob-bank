import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

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
