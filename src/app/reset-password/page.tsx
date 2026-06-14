import PasswordResetForm from "@/components/PasswordResetForm";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return <PasswordResetForm token={params.token} />;
}
