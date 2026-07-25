import Link from "next/link";
import { getClinicDashboardMetrics } from "@/lib/data/dashboard";

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

export default async function DashboardPage() {
  const metrics = await getClinicDashboardMetrics();
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
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
            Clinic overview
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Clinical dashboard
          </h1>
          <p className="mt-2 text-slate-600">
            Monitor your patient population and recent clinical activity.
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
          href="/patients/new"
        >
          Add patient
        </Link>
      </div>

      <section
        aria-label="Clinic summary"
        className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total patients</p>
          <p className="mt-2 text-3xl font-bold">{metrics.totalPatients}</p>
          <Link
            className="mt-4 inline-block text-sm font-semibold text-teal-700 hover:text-teal-800"
            href="/patients"
          >
            View patients →
          </Link>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Assessment completion
          </p>
          <p className="mt-2 text-3xl font-bold">
            {metrics.completionRate}
            <span className="text-lg font-semibold text-slate-500">%</span>
          </p>
          <p className="mt-4 text-sm text-slate-500">
            {metrics.totalAssessments === 0
              ? "No assessments sent yet"
              : `${metrics.completedAssessments} of ${metrics.totalAssessments} sent assessments completed`}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Completed assessments
          </p>
          <p className="mt-2 text-3xl font-bold">
            {metrics.completedAssessments}
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Across {metrics.patientsWithRiskScore}{" "}
            {metrics.patientsWithRiskScore === 1 ? "patient" : "patients"}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Awaiting risk score
          </p>
          <p className="mt-2 text-3xl font-bold">
            {metrics.patientsWithoutRiskScore}
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Patients without a completed DSMA-8
          </p>
        </article>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
    </main>
  );
}
