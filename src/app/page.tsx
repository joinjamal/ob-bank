import KidPortal from "@/components/KidPortal";
import ParentLoginForm from "@/components/ParentLoginForm";
import { getFamilyKidLoginAccounts, getFamilyName, getKidDashboardData } from "@/lib/data";
import { readDeviceFamilyId, readRememberedKidSession } from "@/lib/familySession";

export const dynamic = "force-dynamic";
export const preferredRegion = "hnd1";

export default async function Home() {
  const familyId = await readDeviceFamilyId();

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
      ? await getKidDashboardData(rememberedKid.accountId)
      : null;

  return <KidPortal kids={kids} familyName={familyName} initialKidData={initialKidData} />;
}
