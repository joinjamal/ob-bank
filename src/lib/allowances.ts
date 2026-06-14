import { AllowanceFrequency, Prisma, TransactionType } from "@prisma/client";
import { toMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";

type ScheduleShape = {
  id: string;
  accountId: string;
  frequency: AllowanceFrequency;
  amount: Prisma.Decimal;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  nextRunAt: Date;
  active: boolean;
  account: {
    id: string;
    name: string;
    familyId: string | null;
  };
};

export function serializeRecurringAllowance(schedule: ScheduleShape) {
  return {
    id: schedule.id,
    accountId: schedule.accountId,
    accountName: schedule.account.name,
    frequency: schedule.frequency,
    amount: toMoney(schedule.amount),
    dayOfWeek: schedule.dayOfWeek,
    dayOfMonth: schedule.dayOfMonth,
    nextRunAt: schedule.nextRunAt.toISOString(),
    active: schedule.active
  };
}

function utcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 8));
}

function daysInUtcMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function clampMonthDay(year: number, month: number, day: number) {
  return Math.min(Math.max(day, 1), daysInUtcMonth(year, month));
}

export function nextRunDate({
  frequency,
  dayOfWeek,
  dayOfMonth,
  from = new Date(),
  includeToday = false
}: {
  frequency: AllowanceFrequency;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  from?: Date;
  includeToday?: boolean;
}) {
  const base = utcDay(from);

  if (frequency === AllowanceFrequency.Daily) {
    const next = new Date(base);
    next.setUTCDate(next.getUTCDate() + (includeToday ? 0 : 1));
    return next;
  }

  if (frequency === AllowanceFrequency.Weekly) {
    const target = Math.min(Math.max(Number(dayOfWeek ?? 0), 0), 6);
    const next = new Date(base);
    let offset = (target - next.getUTCDay() + 7) % 7;
    if (offset === 0 && !includeToday) offset = 7;
    next.setUTCDate(next.getUTCDate() + offset);
    return next;
  }

  const targetDay = Math.min(Math.max(Number(dayOfMonth ?? 1), 1), 31);
  let year = base.getUTCFullYear();
  let month = base.getUTCMonth();
  let day = clampMonthDay(year, month, targetDay);

  if (!includeToday && base.getUTCDate() >= day) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
    day = clampMonthDay(year, month, targetDay);
  }

  return new Date(Date.UTC(year, month, day, 8));
}

export function nextRunAfter(schedule: Pick<ScheduleShape, "frequency" | "dayOfWeek" | "dayOfMonth" | "nextRunAt">) {
  if (schedule.frequency === AllowanceFrequency.Daily) {
    const next = new Date(schedule.nextRunAt);
    next.setUTCDate(next.getUTCDate() + 1);
    return next;
  }

  if (schedule.frequency === AllowanceFrequency.Weekly) {
    const next = new Date(schedule.nextRunAt);
    next.setUTCDate(next.getUTCDate() + 7);
    return next;
  }

  return nextRunDate({
    frequency: schedule.frequency,
    dayOfMonth: schedule.dayOfMonth,
    from: schedule.nextRunAt,
    includeToday: false
  });
}

export async function runDueAllowances(familyId: string, now = new Date()) {
  const dueSchedules = await prisma.recurringAllowance.findMany({
    where: {
      active: true,
      nextRunAt: { lte: now },
      account: { familyId }
    },
    include: {
      account: {
        select: {
          id: true,
          name: true,
          familyId: true
        }
      }
    },
    orderBy: { nextRunAt: "asc" }
  });

  if (dueSchedules.length === 0) return 0;

  let createdCount = 0;

  await prisma.$transaction(async (tx) => {
    for (const schedule of dueSchedules) {
      await tx.$queryRaw`SELECT id FROM recurring_allowances WHERE id = ${schedule.id} FOR UPDATE`;
      const lockedSchedule = await tx.recurringAllowance.findFirst({
        where: {
          id: schedule.id,
          active: true,
          nextRunAt: { lte: now },
          account: { familyId }
        }
      });

      if (!lockedSchedule) continue;

      let cursor = lockedSchedule.nextRunAt;
      let guard = 0;

      while (cursor <= now && guard < 60) {
        await tx.transaction.create({
          data: {
            accountId: lockedSchedule.accountId,
            type: TransactionType.Deposit,
            amount: lockedSchedule.amount,
            reason: "Automatic Allowance",
            date: cursor
          }
        });
        await tx.account.update({
          where: { id: lockedSchedule.accountId },
          data: {
            currentBalance: {
              increment: lockedSchedule.amount
            }
          }
        });
        createdCount += 1;
        cursor = nextRunAfter({ ...lockedSchedule, nextRunAt: cursor });
        guard += 1;
      }

      await tx.recurringAllowance.update({
        where: { id: lockedSchedule.id },
        data: { nextRunAt: cursor }
      });
    }
  });

  return createdCount;
}
