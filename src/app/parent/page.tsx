import { cookies } from "next/headers";
import ParentLoginForm from "@/components/ParentLoginForm";
import ParentPanel from "@/components/ParentPanel";
import { getParentData } from "@/lib/data";
import { parentCookieName, readParentSession, readParentSessionToken } from "@/lib/parentAuth";

export const dynamic = "force-dynamic";
export const preferredRegion = "hnd1";

export default async function ParentPage() {
  const cookieStore = await cookies();
  const parentCookie = cookieStore.get(parentCookieName())?.value;
  const signedParentId = readParentSession(parentCookie);
  const tokenParent = signedParentId ? null : await readParentSessionToken(parentCookie);
  const parentId = signedParentId ?? tokenParent?.id;

  if (!parentId) {
    return <ParentLoginForm />;
  }

  const initialData = await getParentData(parentId);

  return <ParentPanel initialData={initialData} />;
}
