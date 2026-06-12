import type { Prisma } from "@prisma/client";

export function toMoney(value: Prisma.Decimal | number | string) {
  return Number(value);
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2
  }).format(value);
}
