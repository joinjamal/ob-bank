import KidPortal from "@/components/KidPortal";
import ParentLoginForm from "@/components/ParentLoginForm";
import { getFamilyKidPortalData } from "@/lib/data";
import { readDeviceFamilyIdOrDefault } from "@/lib/familySession";
import { runDueAllowances } from "@/lib/allowances";

export const dynamic = "force-dynamic";
export const preferredRegion = "hnd1";

export default async function Home() {
  const familyId = await readDeviceFamilyIdOrDefault();

  if (!familyId) {
    return <ParentLoginForm />;
  }

  // Run any due automatic allowances
  await runDueAllowances(familyId);

  const { kids, familyName } = await getFamilyKidPortalData(familyId);

  return <KidPortal kids={kids} familyName={familyName} initialKidData={null} />;
}

