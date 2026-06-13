import "server-only";

import { cookies } from "next/headers";
import { adminCookieName, isValidAdminSession } from "@/lib/adminAuth";

export async function requireAdminApi() {
  const cookieStore = await cookies();
  const session = cookieStore.get(adminCookieName())?.value;

  if (!isValidAdminSession(session)) {
    throw new Error("Admin access is required.");
  }
}
