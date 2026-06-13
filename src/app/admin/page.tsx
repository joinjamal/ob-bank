import { cookies } from "next/headers";
import AdminLoginForm from "@/components/AdminLoginForm";
import AdminPanel from "@/components/AdminPanel";
import { adminCookieName, isAdminConfigured, isValidAdminSession } from "@/lib/adminAuth";

export default async function AdminPage() {
  if (!isAdminConfigured()) {
    return (
      <main className="grid min-h-screen place-items-center px-4 py-8">
        <section className="w-full max-w-lg rounded-[8px] bg-white p-6 shadow-lift">
          <h1 className="text-3xl font-black">Admin password needed</h1>
          <p className="mt-2 font-bold text-ink/60">
            Set <code className="rounded bg-ink/5 px-2 py-1">ADMIN_PASSWORD</code> in Vercel environment variables
            before using parent admin.
          </p>
        </section>
      </main>
    );
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(adminCookieName())?.value;

  if (!isValidAdminSession(session)) {
    return <AdminLoginForm />;
  }

  return <AdminPanel />;
}
