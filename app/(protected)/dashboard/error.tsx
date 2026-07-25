"use client";

import Link from "next/link";

export default function DashboardError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <main className="app-page">
      <section
        aria-labelledby="dashboard-error-title"
        className="app-card accent-top-danger px-5 py-10 text-center sm:px-8 sm:py-12"
        role="alert"
      >
        <p className="text-sm font-semibold uppercase tracking-wider text-red-700">
          Dashboard unavailable
        </p>
        <h1
          className="mt-3 text-2xl font-bold tracking-tight text-[#073a5a]"
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
            className="button-primary"
            onClick={() => unstable_retry()}
            type="button"
          >
            Try again
          </button>
          <Link
            className="button-secondary"
            href="/patients"
          >
            Go to patients
          </Link>
        </div>
      </section>
    </main>
  );
}
