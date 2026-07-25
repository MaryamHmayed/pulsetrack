import Link from "next/link";

export default function LabImportNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Import report not found</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This report does not exist or is not available to your clinic.
        </p>
        <Link
          className="mt-6 inline-flex rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white"
          href="/labs"
        >
          Return to lab uploads
        </Link>
      </div>
    </main>
  );
}
