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
import { kidCookieName, readKidSession } from "@/lib/kidSession";
import { snapshotLedger } from "@/lib/ledger";
import { prisma } from "@/lib/prisma";
import { hashSecret, needsPasswordRehash, verifySecret } from "@/lib/passwords";
import { consumePasswordResetToken, createEmailVerificationToken, createPasswordResetToken } from "@/lib/parentTokens";
import {
  createParentSession,
  familyCookieName,
  parentCookieName,
  readParentSession,
  readParentSessionToken,
  revokeParentSession,
  signParentSession,
  signFamilySession
} from "@/lib/parentAuth";

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

async function assertCanUpdateAccount(accountId: string) {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get(adminCookieName())?.value;
  if (isValidAdminSession(adminSession)) return;

  const kidSession = readKidSession(cookieStore.get(kidCookieName())?.value);
  if (kidSession?.accountId === accountId) return;

  const parentCookie = cookieStore.get(parentCookieName())?.value;
  const tokenParent = await readParentSessionToken(parentCookie);
  const signedParentId = tokenParent?.id ?? readParentSession(parentCookie);
  if (!signedParentId) {
    throw new Error("Access is required.");
  }

  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { familyId: true }
  });
  const parent = await prisma.parent.findUnique({
    where: { id: signedParentId },
    select: { familyId: true }
  });

  if (!account || !parent || account.familyId !== parent.familyId) {
    throw new Error("Access is required.");
  }
}

export async function updateAccountAvatar(accountId: string, avatarUrl: string) {
  await assertCanUpdateAccount(accountId);

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
  await assertCanUpdateAccount(accountId);

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
  const keepSignedIn = String(formData.get("remember") ?? "") === "on";
  const redirectTo = String(formData.get("redirectTo") ?? "/parent");

  const parent = await prisma.parent.findFirst({
    where: {
      OR: [{ email }, { name: { equals: email, mode: "insensitive" } }]
    }
  });

  if (!parent || !verifySecret(password, parent.passwordHash)) {
    return { ok: false, message: "That parent login did not match." };
  }

  if (needsPasswordRehash(parent.passwordHash)) {
    await prisma.parent.update({
      where: { id: parent.id },
      data: { passwordHash: hashSecret(password) }
    });
  }

  const cookieStore = await cookies();
  const maxAge = keepSignedIn ? 60 * 60 * 24 * 90 : 60 * 60 * 12;
  cookieStore.set(parentCookieName(), signParentSession(parent.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge
  });
  cookieStore.set(familyCookieName(), signFamilySession(parent.familyId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180
  });

  redirect(redirectTo === "/" ? "/" : "/parent");
}

export async function signOutParent() {
  const cookieStore = await cookies();
  await revokeParentSession(cookieStore.get(parentCookieName())?.value);
  cookieStore.delete(parentCookieName());
  cookieStore.delete(familyCookieName());
  cookieStore.delete(kidCookieName());
  redirect("/parent");
}

export async function requestPasswordReset(_prevState: { ok: boolean; message: string; resetUrl?: string }, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const parent = email
    ? await prisma.parent.findFirst({ where: { OR: [{ email }, { name: { equals: email, mode: "insensitive" } }] } })
    : null;

  if (!parent) {
    return { ok: true, message: "If that parent exists, a reset link is ready." };
  }

  const token = await createPasswordResetToken(parent.id);
  return {
    ok: true,
    message: "Password reset link created.",
    resetUrl: `/reset-password?token=${encodeURIComponent(token)}`
  };
}

export async function resetParentPassword(_prevState: { ok: boolean; message: string }, formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");

  if (password.length < 6) {
    return { ok: false, message: "Use at least 6 characters for the new password." };
  }

  const parentId = await consumePasswordResetToken(token);
  if (!parentId) {
    return { ok: false, message: "That reset link is invalid or expired." };
  }

  await prisma.$transaction([
    prisma.parent.update({ where: { id: parentId }, data: { passwordHash: hashSecret(password) } }),
    prisma.parentSession.deleteMany({ where: { parentId } })
  ]);

  return { ok: true, message: "Password updated. You can sign in now." };
}

export async function createParentEmailVerificationLink() {
  const cookieStore = await cookies();
  const parent = await readParentSessionToken(cookieStore.get(parentCookieName())?.value);
  if (!parent) throw new Error("Parent access is required.");

  const token = await createEmailVerificationToken(parent.id);
  return `/verify-email/${encodeURIComponent(token)}`;
}

export async function registerParentFamily(_prevState: { ok: boolean; message: string }, formData: FormData) {
  const familyName = String(formData.get("familyName") ?? "").trim();
  const parentName = String(formData.get("parentName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase() || null;
  const password = String(formData.get("password") ?? "");
  const keepSignedIn = String(formData.get("remember") ?? "") === "on";

  if (!familyName || familyName.length > 48 || !parentName || parentName.length > 48) {
    return { ok: false, message: "Enter a family name and parent name." };
  }

  if (password.length < 6) {
    return { ok: false, message: "Use at least 6 characters for the parent password." };
  }

  try {
    const parent = await prisma.$transaction(async (tx) => {
      const family = await tx.family.create({ data: { name: familyName } });
      return tx.parent.create({
        data: {
          familyId: family.id,
          name: parentName,
          email,
          passwordHash: hashSecret(password),
          emailVerifiedAt: email ? null : new Date()
        }
      });
    });

    const cookieStore = await cookies();
    const maxAge = keepSignedIn ? 60 * 60 * 24 * 90 : 60 * 60 * 12;
    cookieStore.set(parentCookieName(), signParentSession(parent.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge
    });
    cookieStore.set(familyCookieName(), signFamilySession(parent.familyId), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 180
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error && error.message.includes("Unique constraint")
        ? "That email is already registered."
        : "Could not create the family."
    };
  }

  redirect("/parent");
}

export async function updateAccountProfileStyle(accountId: string, profileColor: string, profilePattern: string) {
  await assertCanUpdateAccount(accountId);

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
