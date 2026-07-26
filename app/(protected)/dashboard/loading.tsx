function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-slate-200 motion-reduce:animate-none ${className}`}
    />
  );
}

const summarySkeletonStyles = [
  "border-cyan-200/80 bg-gradient-to-br from-white to-teal-100/70",
  "border-sky-200/80 bg-gradient-to-br from-white to-blue-100/70",
  "border-emerald-200/80 bg-gradient-to-br from-white to-green-100/70",
  "border-amber-200/80 bg-gradient-to-br from-white to-orange-100/70",
] as const;

export default function DashboardLoading() {
  return (
    <main
      aria-busy="true"
      aria-labelledby="dashboard-loading-title"
      className="app-page"
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
            className={`app-card min-h-48 p-5 ${summarySkeletonStyles[index] ?? summarySkeletonStyles[0]}`}
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
        className="app-card mt-6 p-6"
      >
        <SkeletonBlock className="h-6 w-64 max-w-full" />
        <SkeletonBlock className="mt-3 h-4 w-96 max-w-full" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.4fr)] lg:items-center">
          <SkeletonBlock className="mx-auto aspect-square w-48 rounded-full sm:w-56" />
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <SkeletonBlock className="h-20 w-full rounded-2xl" key={index} />
            ))}
          </div>
        </div>
      </section>

      <section
        aria-hidden="true"
        className="app-card mt-6 p-6"
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
