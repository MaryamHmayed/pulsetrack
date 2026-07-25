import Link from "next/link";
import { Icon } from "@/app/ui/icons";
import { getClinicDashboardData } from "@/lib/data/dashboard";
import { parseDashboardDateRange } from "@/lib/dashboard/date-range";
import { formatDateTimeUtc } from "@/lib/format/date";

const riskBandDisplay = {
  LOW: {
    label: "Low risk",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
  },
  MODERATE: {
    label: "Moderate risk",
    bar: "bg-yellow-400",
    dot: "bg-yellow-400",
  },
  HIGH: {
    label: "High risk",
    bar: "bg-orange-500",
    dot: "bg-orange-500",
  },
  VERY_HIGH: {
    label: "Very high risk",
    bar: "bg-red-500",
    dot: "bg-red-500",
  },
} as const;

const importStatusStyles = {
  COMPLETED: "bg-emerald-50 text-emerald-700",
  PARTIAL: "bg-amber-50 text-amber-800",
  REJECTED: "bg-red-50 text-red-700",
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
        <article className="app-card flex min-h-44 flex-col p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-600">Total patients</p>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e2f6f7] text-[#087f8a]">
              <Icon className="h-5 w-5" name="patients" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold text-[#073a5a]">{metrics.totalPatients}</p>
          <Link
            className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-teal-700 hover:text-teal-800"
            href="/patients"
          >
            View patients →
          </Link>
        </article>

        <article className="app-card flex min-h-44 flex-col p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-600">
              Assessment completion
            </p>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e2f6f7] text-[#087f8a]">
              <Icon className="h-5 w-5" name="clipboard" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold text-[#073a5a]">
            {metrics.completionRate}
            <span className="text-lg font-semibold text-slate-500">%</span>
          </p>
          <p className="mt-auto pt-4 text-sm text-slate-500">
            {metrics.totalAssessments === 0
              ? "No assessments sent yet"
              : `${metrics.completedAssessments} of ${metrics.totalAssessments} sent assessments completed`}
          </p>
        </article>

        <article className="app-card flex min-h-44 flex-col p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-600">
              Completed assessments
            </p>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e2f6f7] text-[#087f8a]">
              <Icon className="h-5 w-5" name="check" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold text-[#073a5a]">
            {metrics.completedAssessments}
          </p>
          <p className="mt-auto pt-4 text-sm text-slate-500">
            Across {metrics.patientsWithRiskScore}{" "}
            {metrics.patientsWithRiskScore === 1 ? "patient" : "patients"}
          </p>
        </article>

        <article className="app-card flex min-h-44 flex-col p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-600">
              Awaiting risk score
            </p>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e2f6f7] text-[#087f8a]">
              <Icon className="h-5 w-5" name="calendar" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold text-[#073a5a]">
            {metrics.patientsWithoutRiskScore}
          </p>
          <p className="mt-auto pt-4 text-sm text-slate-500">
            Patients without a completed DSMA-8
          </p>
        </article>
      </section>

      <section className="app-card mt-6 p-5 sm:p-6">
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
          <>
            <div
              aria-label={`Risk distribution across ${metrics.patientsWithRiskScore} patients. ${riskSummary}`}
              className="mt-7 flex h-4 overflow-hidden rounded-full bg-slate-100"
              role="img"
            >
              {riskEntries.map(([riskBand, count]) =>
                count > 0 ? (
                  <span
                    aria-hidden="true"
                    className={riskBandDisplay[riskBand].bar}
                    key={riskBand}
                    style={{
                      width: `${(count / metrics.patientsWithRiskScore) * 100}%`,
                    }}
                  />
                ) : null,
              )}
            </div>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {riskEntries.map(([riskBand, count]) => (
                <li
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                  key={riskBand}
                >
                  <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <span
                      aria-hidden="true"
                      className={`h-2.5 w-2.5 rounded-full ${riskBandDisplay[riskBand].dot}`}
                    />
                    {riskBandDisplay[riskBand].label}
                  </span>
                  <span className="font-bold">{count}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="app-card mt-6 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <h2 className="text-lg font-bold">Recent lab uploads</h2>
            <p className="mt-1 text-sm text-slate-500">
              Showing up to 10 most recent files in the selected upload-date
              range.
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
                ? "No uploads match this date range"
                : "No lab files uploaded yet"}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {dateRange.from || dateRange.toExclusive
                ? "Try a wider range or clear the filter."
                : "Upload a CSV to populate recent clinic activity."}
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
                      upload.acceptedCount === 0
                        ? ("REJECTED" as const)
                        : upload.rejectedCount > 0
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
                              : status === "PARTIAL"
                                ? "Partial"
                                : "Rejected"}
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
