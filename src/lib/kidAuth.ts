import { createHash, createHmac, timingSafeEqual } from "crypto";
import { hashSecret, verifySecret } from "@/lib/passwords";

export const defaultKidPin = "0000";

function secret() {
  return process.env.KID_PIN_SECRET || process.env.KID_SESSION_SECRET || process.env.PARENT_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function signPin(pin: string) {
  const sessionSecret = secret();
  if (!sessionSecret) return createHash("sha256").update(`kid-pin:${pin}`).digest("base64url");
  return createHmac("sha256", sessionSecret).update(`kid-pin:${pin}`).digest("base64url");
}

function signPinWithoutSecret(pin: string) {
  return createHash("sha256").update(`kid-pin:${pin}`).digest("base64url");
}

export function hashKidPin(pin: string) {
  return `kidpin$1$${signPin(pin)}`;
}

export function verifyKidPin(pin: string, stored: string) {
  if (stored.startsWith("kidpin$1$")) {
    const [, , hash] = stored.split("$");
    const expected = Buffer.from(hash ?? "", "base64url");
    const actual = Buffer.from(signPin(pin), "base64url");
    if (expected.length === actual.length && timingSafeEqual(expected, actual)) return true;

    const fallbackActual = Buffer.from(signPinWithoutSecret(pin), "base64url");
    return expected.length === fallbackActual.length && timingSafeEqual(expected, fallbackActual);
  }

  return verifySecret(pin, stored);
}

export function needsKidPinRehash(stored: string) {
  return !stored.startsWith("kidpin$1$");
}

export function isValidPinFormat(pin: string) {
  return /^\d{4,8}$/.test(pin);
}
