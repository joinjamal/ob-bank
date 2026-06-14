import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen px-4 py-8">
      <article className="mx-auto max-w-3xl rounded-[8px] bg-white p-6 shadow-lift">
        <Link href="/" className="font-black text-mint">Back to OB Bank</Link>
        <h1 className="mt-5 text-4xl font-black text-ink">Terms of Service</h1>
        <p className="mt-4 font-bold text-ink/65">
          OB Bank helps families track allowance, savings goals, and kid-friendly money activity. Parents are responsible for creating family accounts, managing kid profiles, and deciding what entries are accurate.
        </p>
        <h2 className="mt-6 text-2xl font-black text-ink">Family Use</h2>
        <p className="mt-2 font-bold text-ink/65">
          Parent accounts control family settings, kid profiles, allowance schedules, and transaction logs. Kid access is limited to the family picker and their own vault after PIN verification.
        </p>
        <h2 className="mt-6 text-2xl font-black text-ink">Data Accuracy</h2>
        <p className="mt-2 font-bold text-ink/65">
          OB Bank is an educational ledger and planning tool. It is not a bank, payment processor, stored-value account, or financial institution.
        </p>
        <h2 className="mt-6 text-2xl font-black text-ink">Account Safety</h2>
        <p className="mt-2 font-bold text-ink/65">
          Parents should keep passwords private, rotate kid device links if shared too broadly, and export family records when needed.
        </p>
      </article>
    </main>
  );
}
