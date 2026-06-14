import { hashPassword } from "@/lib/passwords";

export const defaultKidPin = "0000";

export function hashKidPin(pin: string) {
  return hashPassword(pin);
}

export function isValidPinFormat(pin: string) {
  return /^\d{4,8}$/.test(pin);
}
