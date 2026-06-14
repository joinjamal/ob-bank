import { hashSecret, verifySecret } from "@/lib/passwords";

export const defaultKidPin = "0000";

export function hashKidPin(pin: string) {
  return hashSecret(pin);
}

export function verifyKidPin(pin: string, stored: string) {
  return verifySecret(pin, stored);
}

export function isValidPinFormat(pin: string) {
  return /^\d{4,8}$/.test(pin);
}
