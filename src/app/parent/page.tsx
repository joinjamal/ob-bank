import { cookies } from "next/headers";
import ParentLoginForm from "@/components/ParentLoginForm";
import ParentPanel from "@/components/ParentPanel";
import { parentCookieName, readParentSession } from "@/lib/parentAuth";

export const dynamic = "force-dynamic";
export const preferredRegion = "hnd1";

export default async function ParentPage() {
  const cookieStore = await cookies();
  const parentCookie = cookieStore.get(parentCookieName())?.value;
  const parentId = readParentSession(parentCookie);

  if (!parentId) {
    return <ParentLoginForm />;
  }

  return <ParentPanel initialData={null} />;
}
