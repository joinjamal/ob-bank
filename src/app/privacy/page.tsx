import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-4 py-8">
      <article className="mx-auto max-w-3xl rounded-[8px] bg-white p-6 shadow-lift">
        <Link href="/" className="font-black text-mint">Back to OB Bank</Link>
        <h1 className="mt-5 text-4xl font-black text-ink">Privacy Policy</h1>
        <p className="mt-4 font-bold text-ink/65">
          OB Bank stores family names, parent login details, kid profile names/photos, allowance settings, goals, and transaction history so families can use the app across devices.
        </p>
        <h2 className="mt-6 text-2xl font-black text-ink">Children&apos;s Data</h2>
        <p className="mt-2 font-bold text-ink/65">
          Kid data is scoped to the family account. Kids do not need email accounts, and private vault data is shown only after a verified PIN or remembered kid session.
        </p>
        <h2 className="mt-6 text-2xl font-black text-ink">Family Controls</h2>
        <p className="mt-2 font-bold text-ink/65">
          Parents can add or remove kids, reset kid PINs, rotate or revoke kid device links, and export transaction history.
        </p>
        <h2 className="mt-6 text-2xl font-black text-ink">Security</h2>
        <p className="mt-2 font-bold text-ink/65">
          Parent sessions use secure httpOnly cookies. Parent passwords and kid PINs are stored as salted hashes for new credentials, with legacy hashes upgraded during use.
        </p>
      </article>
    </main>
  );
}
