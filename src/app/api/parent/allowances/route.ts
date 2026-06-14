import { AllowanceFrequency } from "@prisma/client";
import { NextResponse } from "next/server";
import { nextRunDate, runDueAllowances, serializeRecurringAllowance } from "@/lib/allowances";
import { requireParentApi } from "@/lib/parentApi";
import { prisma } from "@/lib/prisma";

export const preferredRegion = "hnd1";

function parseFrequency(value: unknown) {
  return value === "Weekly" ? AllowanceFrequency.Weekly : value === "Monthly" ? AllowanceFrequency.Monthly : AllowanceFrequency.Daily;
}

export async function GET() {
  try {
    const parent = await requireParentApi();
    await runDueAllowances(parent.familyId);
    const schedules = await prisma.recurringAllowance.findMany({
      where: { account: { familyId: parent.familyId } },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            familyId: true
          }
        }
      },
      orderBy: [{ active: "desc" }, { nextRunAt: "asc" }]
    });

    return NextResponse.json(schedules.map(serializeRecurringAllowance));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not load automatic allowances." },
      { status: 401 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const parent = await requireParentApi();
    const body = await request.json();
    const accountId = String(body.accountId ?? "");
    const frequency = parseFrequency(body.frequency);
    const amount = Number(body.amount);
    const dayOfWeek = body.dayOfWeek === null || body.dayOfWeek === undefined ? null : Number(body.dayOfWeek);
    const dayOfMonth = body.dayOfMonth === null || body.dayOfMonth === undefined ? null : Number(body.dayOfMonth);

    if (!accountId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ message: "Choose a kid and enter a positive allowance amount." }, { status: 400 });
    }

    const account = await prisma.account.findFirst({
      where: { id: accountId, familyId: parent.familyId },
      select: { id: true }
    });

    if (!account) {
      return NextResponse.json({ message: "Kid account not found for this family." }, { status: 404 });
    }

    const schedule = await prisma.recurringAllowance.create({
      data: {
        accountId: account.id,
        frequency,
        amount,
        dayOfWeek: frequency === AllowanceFrequency.Weekly ? Math.min(Math.max(Number(dayOfWeek ?? 0), 0), 6) : null,
        dayOfMonth: frequency === AllowanceFrequency.Monthly ? Math.min(Math.max(Number(dayOfMonth ?? 1), 1), 31) : null,
        nextRunAt: nextRunDate({ frequency, dayOfWeek, dayOfMonth })
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            familyId: true
          }
        }
      }
    });

    return NextResponse.json(serializeRecurringAllowance(schedule), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not create automatic allowance." },
      { status: 400 }
    );
  }
}
