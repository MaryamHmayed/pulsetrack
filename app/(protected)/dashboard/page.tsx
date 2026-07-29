import Link from "next/link";
import { Icon } from "@/app/ui/icons";
import { getClinicDashboardData } from "@/lib/data/dashboard";
import { parseDashboardDateRange } from "@/lib/dashboard/date-range";
import { formatDateTimeUtc } from "@/lib/format/date";

const riskBandDisplay = {
  LOW: {
    label: "Low risk",
    dot: "bg-emerald-500",
    color: "#10b981",
    surface: "bg-emerald-50/80",
    border: "border-emerald-200/80",
    text: "text-emerald-800",
  },
  MODERATE: {
    label: "Moderate risk",
    dot: "bg-yellow-400",
    color: "#eab308",
    surface: "bg-yellow-50/80",
    border: "border-yellow-200/80",
    text: "text-yellow-800",
  },
  HIGH: {
    label: "High risk",
    dot: "bg-orange-500",
    color: "#f97316",
    surface: "bg-orange-50/80",
    border: "border-orange-200/80",
    text: "text-orange-800",
  },
  VERY_HIGH: {
    label: "Very high risk",
    dot: "bg-red-500",
    color: "#ef4444",
    surface: "bg-red-50/80",
    border: "border-red-200/80",
    text: "text-red-800",
  },
} as const;

const importStatusStyles = {
  COMPLETED: "bg-emerald-50 text-emerald-700",
  PARTIAL: "bg-amber-50 text-amber-800",
} as const;

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const query = await searchParams;
  const dateRange = parseDashboardDateRange(query.from, query.to);
  const metrics = await getClinicDashboardData({
    from: dateRange.error ? undefined : dateRange.from,
    toExclusive: dateRange.error ? undefined : dateRange.toExclusive,
  });
  const riskEntries = Object.entries(metrics.riskBandCounts) as Array<
    [
      keyof typeof metrics.riskBandCounts,
      (typeof metrics.riskBandCounts)[keyof typeof metrics.riskBandCounts],
    ]
  >;
  const riskSummary = riskEntries
    .map(
      ([riskBand, count]) => `${riskBandDisplay[riskBand].label}: ${count}`,
    )
    .join(", ");
  let riskOffset = 0;
  const riskGradientStops = riskEntries.flatMap(([riskBand, count]) => {
    if (count === 0 || metrics.patientsWithRiskScore === 0) {
      return [];
    }

    const start = riskOffset;
    riskOffset += (count / metrics.patientsWithRiskScore) * 100;

    return [
      `${riskBandDisplay[riskBand].color} ${start}% ${riskOffset}%`,
    ];
  });
  const riskChartBackground =
    riskGradientStops.length > 0
      ? `conic-gradient(${riskGradientStops.join(", ")})`
      : "#e2e8f0";

  return (
    <main className="app-page">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="app-eyebrow">
            Clinic overview
          </p>
          <h1 className="app-title mt-2">
            Clinical dashboard
          </h1>
          <p className="app-subtitle mt-2">
            Monitor your patient population and recent clinical activity.
          </p>
        </div>
        <Link
          className="button-primary"
          href="/patients/new"
        >
          <Icon className="h-[18px] w-[18px]" name="plus" />
          Add patient
        </Link>
      </div>

      <section
        aria-label="Clinic summary"
        className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <article className="app-card group relative flex min-h-48 flex-col overflow-hidden border-cyan-200/80 bg-gradient-to-br from-white via-cyan-50/80 to-teal-100/70 p-5 shadow-[0_16px_40px_rgba(8,127,138,0.10)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(8,127,138,0.16)]">
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 to-teal-500"
          />
          <span
            aria-hidden="true"
            className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-cyan-300/30 blur-2xl"
          />
          <div className="relative flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-cyan-950/75">
              Total patients
            </p>
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/80 bg-white/75 text-cyan-700 shadow-sm backdrop-blur">
              <Icon className="h-[22px] w-[22px]" name="patients" />
            </span>
          </div>
          <p className="relative mt-4 text-4xl font-bold tracking-[-0.04em] text-[#073a5a]">
            {metrics.totalPatients}
          </p>
          <Link
            className="relative mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-teal-800 transition group-hover:gap-2.5"
            href="/patients"
          >
            View patients
            <Icon className="h-4 w-4" name="arrow-right" />
          </Link>
        </article>

        <article className="app-card group relative flex min-h-48 flex-col overflow-hidden border-sky-200/80 bg-gradient-to-br from-white via-sky-50/80 to-blue-100/70 p-5 shadow-[0_16px_40px_rgba(14,116,144,0.09)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(14,116,144,0.15)]">
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 to-blue-500"
          />
          <span
            aria-hidden="true"
            className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-sky-300/30 blur-2xl"
          />
          <div className="relative flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-sky-950/75">
              Assessment completion
            </p>
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/80 bg-white/75 text-sky-700 shadow-sm backdrop-blur">
              <Icon className="h-[22px] w-[22px]" name="clipboard" />
            </span>
          </div>
          <p className="relative mt-4 text-4xl font-bold tracking-[-0.04em] text-[#073a5a]">
            {metrics.completionRate}
            <span className="ml-0.5 text-xl font-semibold text-sky-700/70">
              %
            </span>
          </p>
          <div className="relative mt-auto pt-4">
            <div
              aria-hidden="true"
              className="h-2 overflow-hidden rounded-full bg-white/80 shadow-inner"
            >
              <span
                className="block h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-500"
                style={{ width: `${metrics.completionRate}%` }}
              />
            </div>
            <p className="mt-2.5 text-sm text-sky-950/60">
              {metrics.totalAssessments === 0
                ? "No assessments sent yet"
                : `${metrics.completedAssessments} of ${metrics.totalAssessments} assessments completed`}
            </p>
          </div>
        </article>

        <article className="app-card group relative flex min-h-48 flex-col overflow-hidden border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/80 to-green-100/70 p-5 shadow-[0_16px_40px_rgba(5,150,105,0.09)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(5,150,105,0.15)]">
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-green-500"
          />
          <span
            aria-hidden="true"
            className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-emerald-300/30 blur-2xl"
          />
          <div className="relative flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-emerald-950/75">
              Completed assessments
            </p>
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/80 bg-white/75 text-emerald-700 shadow-sm backdrop-blur">
              <Icon className="h-[22px] w-[22px]" name="check" />
            </span>
          </div>
          <p className="relative mt-4 text-4xl font-bold tracking-[-0.04em] text-[#073a5a]">
            {metrics.completedAssessments}
          </p>
          <p className="relative mt-auto pt-4 text-sm text-emerald-950/60">
            Across {metrics.patientsWithRiskScore}{" "}
            {metrics.patientsWithRiskScore === 1 ? "patient" : "patients"}
          </p>
        </article>

        <article className="app-card group relative flex min-h-48 flex-col overflow-hidden border-amber-200/80 bg-gradient-to-br from-white via-amber-50/80 to-orange-100/70 p-5 shadow-[0_16px_40px_rgba(217,119,6,0.09)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(217,119,6,0.15)]">
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500"
          />
          <span
            aria-hidden="true"
            className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-amber-300/35 blur-2xl"
          />
          <div className="relative flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-amber-950/75">
              Awaiting risk score
            </p>
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/80 bg-white/75 text-amber-700 shadow-sm backdrop-blur">
              <Icon className="h-[22px] w-[22px]" name="calendar" />
            </span>
          </div>
          <p className="relative mt-4 text-4xl font-bold tracking-[-0.04em] text-[#073a5a]">
            {metrics.patientsWithoutRiskScore}
          </p>
          <p className="relative mt-auto pt-4 text-sm text-amber-950/60">
            Patients without a completed DSMA-8
          </p>
        </article>
      </section>

      <section className="app-card mt-6 overflow-hidden border-slate-200/80 bg-gradient-to-br from-white via-white to-cyan-50/50 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Patients by latest risk band</h2>
            <p className="mt-1 text-sm text-slate-500">
              Each patient is counted once using their most recent completed
              DSMA-8.
            </p>
          </div>
          <Link
            className="text-sm font-semibold text-teal-700 hover:text-teal-800"
            href="/patients"
          >
            Review patients →
          </Link>
        </div>

        {metrics.patientsWithRiskScore === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center">
            <p className="text-sm font-medium text-slate-700">
              No patient risk scores yet
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Risk distribution will appear after patients complete the
              DSMA-8.
            </p>
          </div>
        ) : (
          <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.4fr)] lg:items-center">
            <div
              aria-label={`Risk distribution across ${metrics.patientsWithRiskScore} patients. ${riskSummary}`}
              className="mx-auto grid aspect-square w-48 shrink-0 place-items-center rounded-full p-4 shadow-[0_20px_45px_rgba(7,58,90,0.14)] sm:w-56"
              role="img"
              style={{ background: riskChartBackground }}
            >
              <div className="grid h-full w-full place-items-center rounded-full border border-white/90 bg-white text-center shadow-inner">
                <div>
                  <span className="block text-4xl font-bold tracking-[-0.04em] text-[#073a5a]">
                    {metrics.patientsWithRiskScore}
                  </span>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Scored patients
                  </span>
                </div>
              </div>
            </div>
            <ul className="grid min-w-0 gap-3 sm:grid-cols-2">
              {riskEntries.map(([riskBand, count]) => {
                const percentage = Math.round(
                  (count / metrics.patientsWithRiskScore) * 100,
                );
                const display = riskBandDisplay[riskBand];

                return (
                  <li
                    className={`rounded-2xl border p-4 ${display.surface} ${display.border}`}
                    key={riskBand}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`inline-flex min-w-0 items-center gap-2 text-sm font-semibold ${display.text}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${display.dot}`}
                        />
                        <span className="truncate">{display.label}</span>
                      </span>
                      <span className="text-lg font-bold text-[#073a5a]">
                        {count}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <div
                        aria-hidden="true"
                        className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/90 shadow-inner"
                      >
                        <span
                          className="block h-full rounded-full"
                          style={{
                            backgroundColor: display.color,
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs font-semibold text-slate-500">
                        {percentage}%
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      <section className="app-card mt-6 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <h2 className="text-lg font-bold">Recent lab uploads</h2>
            <p className="mt-1 text-sm text-slate-500">
              Showing up to 10 recent files that imported at least one result
              in the selected upload-date range.
            </p>
          </div>
          <form
            action="/dashboard"
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            method="get"
          >
            <label className="text-xs font-semibold text-slate-600">
              From
              <input
                className="field-control mt-1 block w-full py-2 text-sm font-normal"
                defaultValue={dateRange.fromText}
                max={new Date().toISOString().slice(0, 10)}
                name="from"
                type="date"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              To
              <input
                className="field-control mt-1 block w-full py-2 text-sm font-normal"
                defaultValue={dateRange.toText}
                max={new Date().toISOString().slice(0, 10)}
                name="to"
                type="date"
              />
            </label>
            <div className="flex gap-2">
              <button
                className="button-primary min-h-10 px-4 py-2"
                type="submit"
              >
                Apply
              </button>
              {dateRange.fromText || dateRange.toText ? (
                <Link
                  className="button-secondary min-h-10 px-4 py-2"
                  href="/dashboard"
                >
                  Clear
                </Link>
              ) : null}
            </div>
          </form>
        </div>

        {dateRange.error ? (
          <p
            className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            role="alert"
          >
            {dateRange.error} The filter was not applied.
          </p>
        ) : null}

        {metrics.recentUploads.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center">
            <p className="text-sm font-medium text-slate-700">
              {dateRange.from || dateRange.toExclusive
                ? "No imports match this date range"
                : "No lab results imported yet"}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {dateRange.from || dateRange.toExclusive
                ? "Try a wider range or clear the filter."
                : "Upload a CSV with at least one valid row to populate recent clinic activity."}
            </p>
            {!dateRange.from && !dateRange.toExclusive ? (
              <Link
                className="mt-4 inline-block text-sm font-semibold text-teal-700 hover:text-teal-800"
                href="/labs"
              >
                Upload lab results
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <caption className="sr-only">
                  Recent lab uploads matching the selected date range
                </caption>
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold" scope="col">
                      File
                    </th>
                    <th className="px-4 py-3 font-semibold" scope="col">
                      Uploaded
                    </th>
                    <th className="px-4 py-3 font-semibold" scope="col">
                      Outcome
                    </th>
                    <th className="px-4 py-3 font-semibold" scope="col">
                      Rows
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metrics.recentUploads.map((upload) => {
                    const status =
                      upload.rejectedCount > 0
                        ? ("PARTIAL" as const)
                        : ("COMPLETED" as const);

                    return (
                      <tr className="transition hover:bg-[#f6fbfc]" key={upload.id}>
                        <th className="px-4 py-4 font-medium" scope="row">
                          {upload.fileName}
                        </th>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                          {formatDateTimeUtc(upload.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${importStatusStyles[status]}`}
                          >
                            {status === "COMPLETED"
                              ? "Completed"
                              : "Partial"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span className="font-semibold text-emerald-700">
                            {upload.acceptedCount} accepted
                          </span>
                          <span className="mx-2 text-slate-300">·</span>
                          <span className="font-semibold text-red-700">
                            {upload.rejectedCount} rejected
                          </span>
                          <span className="mt-1 block text-xs text-slate-500">
                            {upload.totalRows} total
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-right">
              <Link
                className="text-sm font-semibold text-teal-700 hover:text-teal-800"
                href="/labs"
              >
                View all uploads →
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
