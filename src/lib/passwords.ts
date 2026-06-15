import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

export function hashPassword(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

const iterations = 60_000;
const keyLength = 32;
const digest = "sha256";

export function hashSecret(value: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = pbkdf2Sync(value, salt, iterations, keyLength, digest).toString("base64url");
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

export function verifySecret(value: string, stored: string) {
  if (!stored.startsWith("pbkdf2$")) {
    return hashPassword(value) === stored;
  }

  const [, iterationText, salt, hash] = stored.split("$");
  const parsedIterations = Number(iterationText);
  if (!parsedIterations || !salt || !hash) return false;

  const expected = Buffer.from(hash, "base64url");
  const actual = pbkdf2Sync(value, salt, parsedIterations, expected.length, digest);

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function needsPasswordRehash(stored: string) {
  return !stored.startsWith("pbkdf2$");
}

export function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function createPlainToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}
