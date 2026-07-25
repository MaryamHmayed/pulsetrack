"use client";

export default function PatientsError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <main className="app-page max-w-3xl text-center">
      <div className="app-card accent-top-danger p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-red-700">
          Patient data unavailable
        </p>
        <h1 className="mt-3 text-2xl font-bold text-[#073a5a]">
          We couldn’t load this information
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Your data was not changed. Check your connection and try again.
        </p>
        <button
          className="button-primary mt-6"
          onClick={() => unstable_retry()}
          type="button"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
