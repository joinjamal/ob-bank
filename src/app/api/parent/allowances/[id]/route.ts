import { AllowanceFrequency } from "@prisma/client";
import { NextResponse } from "next/server";
import { nextRunDate, serializeRecurringAllowance } from "@/lib/allowances";
import { requireParentApi } from "@/lib/parentApi";
import { prisma } from "@/lib/prisma";

export const preferredRegion = "hnd1";

type Context = {
  params: Promise<{ id: string }>;
};

function parseFrequency(value: unknown) {
  return value === "Weekly" ? AllowanceFrequency.Weekly : value === "Monthly" ? AllowanceFrequency.Monthly : AllowanceFrequency.Daily;
}

export async function PATCH(request: Request, context: Context) {
  try {
    const parent = await requireParentApi();
    const { id } = await context.params;
    const body = await request.json();
    const existing = await prisma.recurringAllowance.findFirst({
      where: { id, account: { familyId: parent.familyId } },
      include: { account: { select: { id: true, name: true, familyId: true } } }
    });

    if (!existing) {
      return NextResponse.json({ message: "Automatic allowance not found." }, { status: 404 });
    }

    const hasScheduleChange =
      body.frequency !== undefined || body.amount !== undefined || body.dayOfWeek !== undefined || body.dayOfMonth !== undefined;
    const frequency = body.frequency === undefined ? existing.frequency : parseFrequency(body.frequency);
    const amount = body.amount === undefined ? Number(existing.amount) : Number(body.amount);
    const dayOfWeek = body.dayOfWeek === undefined ? existing.dayOfWeek : body.dayOfWeek === null ? null : Number(body.dayOfWeek);
    const dayOfMonth = body.dayOfMonth === undefined ? existing.dayOfMonth : body.dayOfMonth === null ? null : Number(body.dayOfMonth);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ message: "Enter a positive allowance amount." }, { status: 400 });
    }

    const schedule = await prisma.recurringAllowance.update({
      where: { id },
      data: {
        active: body.active === undefined ? existing.active : Boolean(body.active),
        frequency,
        amount,
        dayOfWeek: frequency === AllowanceFrequency.Weekly ? Math.min(Math.max(Number(dayOfWeek ?? 0), 0), 6) : null,
        dayOfMonth: frequency === AllowanceFrequency.Monthly ? Math.min(Math.max(Number(dayOfMonth ?? 1), 1), 31) : null,
        ...(hasScheduleChange ? { nextRunAt: nextRunDate({ frequency, dayOfWeek, dayOfMonth }) } : {})
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

    return NextResponse.json(serializeRecurringAllowance(schedule));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not update automatic allowance." },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const parent = await requireParentApi();
    const { id } = await context.params;
    const existing = await prisma.recurringAllowance.findFirst({
      where: { id, account: { familyId: parent.familyId } },
      select: { id: true }
    });

    if (!existing) {
      return NextResponse.json({ message: "Automatic allowance not found." }, { status: 404 });
    }

    await prisma.recurringAllowance.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not delete automatic allowance." },
      { status: 400 }
    );
  }
}
