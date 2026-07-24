"use client";

export default function AssessmentError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-16">
      <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-700">
          PulseTrack
        </p>
        <h1 className="mt-4 text-2xl font-bold text-slate-950">
          Assessment temporarily unavailable
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          Your responses have not been changed. Check your connection and try
          again, or contact your clinic for help.
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
