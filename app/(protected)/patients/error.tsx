"use client";

export default function PatientsError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
      <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-red-700">
          Patient data unavailable
        </p>
        <h1 className="mt-3 text-2xl font-bold">
          We couldn’t load this information
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Your data was not changed. Check your connection and try again.
        </p>
        <button
          className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          onClick={() => unstable_retry()}
          type="button"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
