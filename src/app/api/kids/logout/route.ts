import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { kidCookieName } from "@/lib/kidSession";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(kidCookieName());
  return NextResponse.json({ ok: true });
}
