import "server-only";

import { createHash, timingSafeEqual } from "crypto";

const COOKIE_NAME = "ob_bank_admin";

export function adminCookieName() {
  return COOKIE_NAME;
}

function secret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && secret());
}

export function signAdminSession() {
  return createHash("sha256").update(`ob-bank:${secret()}`).digest("hex");
}

export function isValidAdminSession(value?: string) {
  if (!value || !isAdminConfigured()) return false;

  const expected = signAdminSession();
  const actualBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function isValidAdminPassword(password: string) {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword) return false;

  const actualBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(configuredPassword);

  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}
