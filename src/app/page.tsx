import KidPortal from "@/components/KidPortal";
import ParentLoginForm from "@/components/ParentLoginForm";
import { getFamilyKidLoginAccounts, getFamilyName, getKidQuickDashboardData } from "@/lib/data";
import { readDeviceFamilyIdOrDefault, readRememberedKidSession } from "@/lib/familySession";

export const dynamic = "force-dynamic";
export const preferredRegion = "hnd1";

export default async function Home() {
  const familyId = await readDeviceFamilyIdOrDefault();

  if (!familyId) {
    return <ParentLoginForm />;
  }

  const [kids, familyName, rememberedKid] = await Promise.all([
    getFamilyKidLoginAccounts(familyId),
    getFamilyName(familyId),
    readRememberedKidSession()
  ]);
  const initialKidData =
    rememberedKid && rememberedKid.familyId === familyId
      ? await getKidQuickDashboardData(rememberedKid.accountId)
      : null;

  return <KidPortal kids={kids} familyName={familyName} initialKidData={initialKidData} />;
}
