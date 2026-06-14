import KidPortal from "@/components/KidPortal";
import { getKidLoginAccounts } from "@/lib/data";

export const dynamic = "force-dynamic";
export const preferredRegion = "hnd1";

export default async function Home() {
  const kids = await getKidLoginAccounts();

  return <KidPortal kids={kids} />;
}
