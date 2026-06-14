"use server";

import { TransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  adminCookieName,
  isValidAdminPassword,
  isValidAdminSession,
  signAdminSession
} from "@/lib/adminAuth";
import { recalculateAccountBalance } from "@/lib/balances";
import { snapshotLedger } from "@/lib/ledger";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/passwords";
import { parentCookieName, signParentSession } from "@/lib/parentAuth";

export async function signInAdmin(_prevState: { ok: boolean; message: string }, formData: FormData) {
  const password = String(formData.get("password") ?? "");

  if (!isValidAdminPassword(password)) {
    return { ok: false, message: "That password did not match." };
  }

  const cookieStore = await cookies();
  cookieStore.set(adminCookieName(), signAdminSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });

  redirect("/admin");
}

export async function signOutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(adminCookieName());
  redirect("/admin");
}

async function assertAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get(adminCookieName())?.value;

  if (!isValidAdminSession(session)) {
    throw new Error("Admin access is required.");
  }
}

export async function updateAccountAvatar(accountId: string, avatarUrl: string) {
  if (!avatarUrl.startsWith("data:image/")) {
    throw new Error("Please choose an image file.");
  }

  if (avatarUrl.length > 750_000) {
    throw new Error("Please choose a smaller image.");
  }

  await prisma.account.update({
    where: { id: accountId },
    data: { avatarUrl }
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateAccountGoal(accountId: string, goalName: string | null, goalAmount: number | null) {
  await prisma.account.update({
    where: { id: accountId },
    data: { goalName, goalAmount }
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function signInParent(_prevState: { ok: boolean; message: string }, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const parent = await prisma.parent.findFirst({
    where: {
      OR: [{ email }, { name: { equals: email, mode: "insensitive" } }]
    }
  });

  if (!parent || parent.passwordHash !== hashPassword(password)) {
    return { ok: false, message: "That parent login did not match." };
  }

  const cookieStore = await cookies();
  cookieStore.set(parentCookieName(), signParentSession(parent.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });

  redirect("/parent");
}

export async function signOutParent() {
  const cookieStore = await cookies();
  cookieStore.delete(parentCookieName());
  redirect("/parent");
}

export async function updateAccountProfileStyle(accountId: string, profileColor: string, profilePattern: string) {
  const safeColor = /^#[0-9A-Fa-f]{6}$/.test(profileColor) ? profileColor : "#DCEBFF";
  const safePattern = ["soft", "dots", "stars", "stripes", "grid"].includes(profilePattern)
    ? profilePattern
    : "soft";

  await prisma.account.update({
    where: { id: accountId },
    data: {
      profileColor: safeColor,
      profilePattern: safePattern
    }
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateTransaction(
  transactionId: string,
  payload: { type: "Deposit" | "Withdrawal"; amount: number; reason?: string }
) {
  await assertAdmin();

  const amount = Number(payload.amount);
  const type = payload.type === "Withdrawal" ? TransactionType.Withdrawal : TransactionType.Deposit;
  const reason = String(payload.reason ?? "").trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Enter a positive amount.");
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.transaction.findUnique({
      where: { id: transactionId },
      select: { accountId: true }
    });

    if (!existing) {
      throw new Error("Transaction not found.");
    }

    await tx.transaction.update({
      where: { id: transactionId },
      data: { type, amount, reason }
    });

    await recalculateAccountBalance(tx, existing.accountId, { allowNegative: true });
  });

  await snapshotLedger();
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteTransaction(transactionId: string) {
  await assertAdmin();

  await prisma.$transaction(async (tx) => {
    const existing = await tx.transaction.findUnique({
      where: { id: transactionId },
      select: { accountId: true }
    });

    if (!existing) {
      throw new Error("Transaction not found.");
    }

    await tx.transaction.delete({ where: { id: transactionId } });
    await recalculateAccountBalance(tx, existing.accountId, { allowNegative: true });
  });

  await snapshotLedger();
  revalidatePath("/");
  revalidatePath("/admin");
}
