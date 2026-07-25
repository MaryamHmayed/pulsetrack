import Link from "next/link";

export default function PatientNotFound() {
  return (
    <main className="app-page max-w-3xl text-center">
      <div className="app-card p-6 sm:p-8">
        <p className="app-eyebrow">
          Patient unavailable
        </p>
        <h1 className="mt-3 text-2xl font-bold text-[#073a5a]">Patient not found</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This record does not exist or is not assigned to your account.
        </p>
        <Link
          className="button-primary mt-6"
          href="/patients"
        >
          Return to patients
        </Link>
      </div>
    </main>
  );
}
