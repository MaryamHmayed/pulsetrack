"use client";

import { PulseTrackLogo } from "@/app/ui/pulsetrack-logo";

export default function AssessmentError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <main className="login-backdrop relative flex min-h-screen items-center overflow-hidden px-4 py-10">
      <div className="app-card accent-top-danger relative z-10 mx-auto w-full max-w-xl p-6 text-center sm:p-8">
        <PulseTrackLogo className="justify-center" compact />
        <h1 className="mt-6 text-2xl font-bold text-[#073a5a]">
          Assessment temporarily unavailable
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          Your responses have not been changed. Check your connection and try
          again, or contact your clinic for help.
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
