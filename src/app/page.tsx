import KidPortal from "@/components/KidPortal";
import ParentLoginForm from "@/components/ParentLoginForm";
import { getFamilyKidPortalData } from "@/lib/data";
import { readDeviceFamilyIdOrDefault } from "@/lib/familySession";
import { runDueAllowances } from "@/lib/allowances";

export const dynamic = "force-dynamic";
export const preferredRegion = "hnd1";

export default async function Home() {
  let familyId: string | null = null;

  try {
    familyId = await readDeviceFamilyIdOrDefault();
  } catch {
    // Database may be unreachable — show login form as fallback
    return <ParentLoginForm />;
  }

  if (!familyId) {
    return <ParentLoginForm />;
  }

  // Run due allowances — failures should not block page load
  try {
    await runDueAllowances(familyId);
  } catch {
    // Allowance run failed (e.g. DB timeout) — continue anyway
  }

  try {
    const { kids, familyName } = await getFamilyKidPortalData(familyId);
    return <KidPortal kids={kids} familyName={familyName} initialKidData={null} />;
  } catch {
    // Database query failed — show login form as fallback
    return <ParentLoginForm />;
  }
}
