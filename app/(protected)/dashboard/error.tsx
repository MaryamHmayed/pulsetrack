"use client";

import Link from "next/link";

export default function DashboardError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section
        aria-labelledby="dashboard-error-title"
        className="rounded-2xl border border-red-200 bg-white px-6 py-12 text-center shadow-sm"
        role="alert"
      >
        <p className="text-sm font-semibold uppercase tracking-wider text-red-700">
          Dashboard unavailable
        </p>
        <h1
          className="mt-3 text-2xl font-bold tracking-tight text-slate-950"
          id="dashboard-error-title"
        >
          We couldn’t load the clinic overview
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">
          The data service may be temporarily unavailable. No clinic data was
          changed. Try loading the dashboard again.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            className="rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
            onClick={() => unstable_retry()}
            type="button"
          >
            Try again
          </button>
          <Link
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            href="/patients"
          >
            Go to patients
          </Link>
        </div>
      </section>
    </main>
  );
}
