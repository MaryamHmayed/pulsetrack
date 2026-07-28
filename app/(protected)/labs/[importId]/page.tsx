import Link from "next/link";
import { notFound } from "next/navigation";
import { getLabImportReport } from "@/lib/data/lab-imports";
import { formatDateTimeUtc } from "@/lib/format/date";
import { ValidationReport } from "../validation-report";
import { LabFhirRetryButton } from "../fhir-retry-button";

export default async function LabImportReportPage({
  params,
}: {
  params: Promise<{ importId: string }>;
}) {
  const { importId } = await params;
  const labImport = await getLabImportReport(importId);

  if (!labImport) {
    notFound();
  }

  return (
    <main className="app-page">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-slate-500">
            {labImport.fileName} · {formatDateTimeUtc(labImport.createdAt)}
          </p>
          <h1 className="app-title mt-2">
            Lab import complete
          </h1>
        </div>
        <Link
          className="button-primary"
          href="/labs"
        >
          Upload another file
        </Link>
      </div>

      <section className="app-card mt-8 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="app-eyebrow">FHIR delivery</p>
            <h2 className="mt-2 text-lg font-bold text-slate-900">
              External synchronization
            </h2>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            {labImport.fhirSync.total > 0 ? (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  labImport.fhirSync.failed > 0
                    ? "bg-red-50 text-red-700"
                    : labImport.fhirSync.pending > 0
                      ? "bg-amber-50 text-amber-800"
                      : "bg-teal-50 text-teal-800"
                }`}
              >
                {labImport.fhirSync.synced}/{labImport.fhirSync.total} synced
              </span>
            ) : null}
            {labImport.fhirSync.failed > 0 ? (
              <LabFhirRetryButton importId={labImport.id} />
            ) : null}
          </div>
        </div>

        {labImport.fhirSync.total === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            No new lab results were accepted, so no FHIR Observations were
            created.
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            Accepted rows remain stored locally even if the external FHIR
            server is temporarily unavailable.
          </p>
        )}

        {labImport.fhirSync.errors.length > 0 ? (
          <div
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <p className="font-semibold">
              {labImport.fhirSync.failed} Observation
              {labImport.fhirSync.failed === 1 ? "" : "s"} failed to sync.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {labImport.fhirSync.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <div className="mt-8">
        <ValidationReport report={labImport.report} />
      </div>
    </main>
  );
}
