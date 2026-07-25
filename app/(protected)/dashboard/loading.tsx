function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-slate-200 motion-reduce:animate-none ${className}`}
    />
  );
}

export default function DashboardLoading() {
  return (
    <main
      aria-busy="true"
      aria-labelledby="dashboard-loading-title"
      className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
    >
      <p className="sr-only" id="dashboard-loading-title" role="status">
        Loading clinic dashboard
      </p>

      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="w-full max-w-xl">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="mt-3 h-9 w-64 max-w-full" />
          <SkeletonBlock className="mt-3 h-5 w-full" />
        </div>
        <SkeletonBlock className="h-11 w-32" />
      </div>

      <section
        aria-hidden="true"
        className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {Array.from({ length: 4 }, (_, index) => (
          <div
            className="rounded-2xl border border-slate-200 bg-white p-5"
            key={index}
          >
            <SkeletonBlock className="h-4 w-36" />
            <SkeletonBlock className="mt-4 h-9 w-20" />
            <SkeletonBlock className="mt-5 h-4 w-full" />
          </div>
        ))}
      </section>

      <section
        aria-hidden="true"
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <SkeletonBlock className="h-6 w-64 max-w-full" />
        <SkeletonBlock className="mt-3 h-4 w-96 max-w-full" />
        <SkeletonBlock className="mt-8 h-4 w-full rounded-full" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonBlock className="h-12 w-full" key={index} />
          ))}
        </div>
      </section>

      <section
        aria-hidden="true"
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <div className="flex flex-col justify-between gap-5 lg:flex-row">
          <div className="w-full max-w-md">
            <SkeletonBlock className="h-6 w-48" />
            <SkeletonBlock className="mt-3 h-4 w-full" />
          </div>
          <SkeletonBlock className="h-10 w-80 max-w-full" />
        </div>
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <SkeletonBlock className="h-14 w-full" key={index} />
          ))}
        </div>
      </section>
    </main>
  );
}
