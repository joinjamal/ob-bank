import { cookies } from "next/headers";
import ParentLoginForm from "@/components/ParentLoginForm";
import ParentPanel from "@/components/ParentPanel";
import { getParentData } from "@/lib/data";
import { parentCookieName, readParentSession } from "@/lib/parentAuth";

export const dynamic = "force-dynamic";
export const preferredRegion = "hnd1";

export default async function ParentPage() {
  const cookieStore = await cookies();
  const parentId = readParentSession(cookieStore.get(parentCookieName())?.value);

  if (!parentId) {
    return <ParentLoginForm />;
  }

  const initialData = await getParentData(parentId);

  return <ParentPanel initialData={initialData} />;
}
