import KidPortal from "@/components/KidPortal";
import { getKidLoginAccounts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const kids = await getKidLoginAccounts();

  return <KidPortal kids={kids} />;
}
