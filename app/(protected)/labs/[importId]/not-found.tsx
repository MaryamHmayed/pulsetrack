import Link from "next/link";

export default function LabImportNotFound() {
  return (
    <main className="app-page max-w-3xl text-center">
      <div className="app-card p-6 sm:p-8">
        <p className="app-eyebrow">Lab import unavailable</p>
        <h1 className="mt-3 text-2xl font-bold text-[#073a5a]">Import report not found</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This report does not exist or is not available to your clinic.
        </p>
        <Link
          className="button-primary mt-6"
          href="/labs"
        >
          Return to lab uploads
        </Link>
      </div>
    </main>
  );
}
