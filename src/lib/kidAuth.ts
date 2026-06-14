import { createHash } from "crypto";

export const defaultKidPin = "0000";

export function hashKidPin(pin: string) {
  return createHash("sha256").update(pin).digest("hex");
}

export function isValidPinFormat(pin: string) {
  return /^\d{4,8}$/.test(pin);
}
