import Link from "next/link";

export default function PatientNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
          Patient unavailable
        </p>
        <h1 className="mt-3 text-2xl font-bold">Patient not found</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This record does not exist or is not assigned to your account.
        </p>
        <Link
          className="mt-6 inline-flex rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white"
          href="/patients"
        >
          Return to patients
        </Link>
      </div>
    </main>
  );
}
