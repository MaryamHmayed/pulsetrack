import Link from "next/link";
import { notFound } from "next/navigation";
import { PaginationNav } from "@/app/ui/pagination-nav";
import { getPatient } from "@/lib/data/patients";
import { getAssessmentHistory } from "@/lib/data/assessments";
import { getPatientLabResults } from "@/lib/data/lab-results";
import { getLatestPatientClinicalReview } from "@/lib/ai/reviews";
import { formatDateTimeUtc } from "@/lib/format/date";
import { paginateItems, parsePage } from "@/lib/pagination";
import { DeletePatientButton } from "../delete-patient-button";
import { PatientFhirRetryButton } from "../fhir-retry-button";
import { SendAssessmentButton } from "../send-assessment-button";
import { AssessmentScoreChart } from "./assessment-score-chart";
import { LabTrendChart } from "./lab-trend-chart";
import { ClinicalReviewPanel } from "./clinical-review-panel";

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

const statusStyles = {
  SENT: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  EXPIRED: "bg-slate-100 text-slate-600",
} as const;

const riskLabels = {
  LOW: "Low risk",
  MODERATE: "Moderate risk",
  HIGH: "High risk",
  VERY_HIGH: "Very high risk",
} as const;

const labRangeStyles = {
  LOW: "bg-blue-50 text-blue-700",
  NORMAL: "bg-emerald-50 text-emerald-700",
  HIGH: "bg-red-50 text-red-700",
  UNKNOWN: "bg-slate-100 text-slate-600",
} as const;

const labRangeLabels = {
  LOW: "Low",
  NORMAL: "Within range",
  HIGH: "High",
  UNKNOWN: "Range unavailable",
} as const;

const fhirSyncStyles = {
  PENDING: "bg-amber-50 text-amber-800",
  SYNCED: "bg-teal-50 text-teal-800",
  FAILED: "bg-red-50 text-red-700",
  READ_ONLY: "bg-slate-100 text-slate-700",
} as const;

const fhirSyncLabels = {
  PENDING: "Awaiting FHIR",
  SYNCED: "FHIR synced",
  FAILED: "Sync needs attention",
  READ_ONLY: "FHIR history · read-only",
} as const;

const labFhirSyncLabels = {
  PENDING: "Awaiting FHIR",
  SYNCED: "FHIR synced",
  FAILED: "Needs attention",
  READ_ONLY: "Not applicable",
} as const;

const labSourceStyles = {
  LOCAL: "border-blue-200 bg-blue-50 text-blue-700",
  FHIR: "border-slate-200 bg-slate-100 text-slate-700",
} as const;

const labSourceLabels = {
  LOCAL: "Local CSV",
  FHIR: "FHIR history",
} as const;

function getAge(dob: Date) {
  const today = new Date();
  let age = today.getUTCFullYear() - dob.getUTCFullYear();
  const monthDifference = today.getUTCMonth() - dob.getUTCMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getUTCDate() < dob.getUTCDate())
  ) {
    age -= 1;
  }

  return age;
}

export default async function PatientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    assessmentsPage?: string | string[];
    labsPage?: string | string[];
  }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const patient = await getPatient(id);

  if (!patient) {
    notFound();
  }

  const [assessments, labResults, clinicalReview] = await Promise.all([
    getAssessmentHistory(patient.id),
    getPatientLabResults(patient.id),
    getLatestPatientClinicalReview(patient.id),
  ]);
  const glucoseResults = labResults.filter(
    (result) => result.testCode === "GLU-F",
  );
  const hba1cResults = labResults.filter(
    (result) => result.testCode === "HBA1C",
  );
  const completedScores = assessments.flatMap((assessment) =>
    assessment.displayStatus === "COMPLETED" &&
    assessment.completedAt &&
    assessment.score !== null
      ? [
          {
            completedAt: assessment.completedAt,
            score: assessment.score,
          },
        ]
      : [],
  );
  const labPage = paginateItems(labResults, parsePage(query.labsPage));
  const assessmentPage = paginateItems(
    assessments,
    parsePage(query.assessmentsPage),
  );
  const paginationQuery = {
    assessmentsPage:
      assessmentPage.page > 1 ? String(assessmentPage.page) : undefined,
    labsPage: labPage.page > 1 ? String(labPage.page) : undefined,
  };

  return (
    <main className="app-page">
      <Link
        className="text-sm font-semibold text-teal-700 hover:text-teal-800"
        href="/patients"
      >
        ← Back to patients
      </Link>

      <nav
        aria-label="Patient page sections"
        className="app-card mt-5 overflow-x-auto p-2"
      >
        <div className="flex min-w-max gap-1">
          {[
            ["overview", "Overview"],
            ["clinical-review", "AI clinical review"],
            ["lab-trends", "Lab trends"],
            ["lab-results", `Lab results (${labResults.length})`],
            ["assessments", `Assessments (${assessments.length})`],
          ].map(([target, label]) => (
            <a
              className="min-h-10 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-teal-50 hover:text-teal-800 focus-visible:bg-teal-50"
              href={`#${target}`}
              key={target}
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      <section
        className="app-card mt-6 scroll-mt-28 overflow-hidden p-6 sm:p-8"
        id="overview"
      >
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-mono text-sm text-slate-500">{patient.mrn}</p>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${fhirSyncStyles[patient.fhirSyncStatus]}`}
              >
                {fhirSyncLabels[patient.fhirSyncStatus]}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                {patient.fhirOwnership === "READ_ONLY"
                  ? "Source: FHIR history"
                  : "Source: local"}
              </span>
            </div>
            <h1 className="app-title mt-2">
              {patient.fullName}
            </h1>
            <p className="mt-2 text-slate-600">
              {getAge(patient.dob)} years old ·{" "}
              <span className="capitalize">{patient.sex.toLowerCase()}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="button-secondary min-h-10 px-4 py-2"
              href={`/patients/${patient.id}/edit`}
            >
              {patient.fhirOwnership === "READ_ONLY"
                ? "Edit local record"
                : "Edit patient"}
            </Link>
            <DeletePatientButton
              patientId={patient.id}
              patientName={patient.fullName}
            />
          </div>
        </div>

        {patient.fhirSyncStatus === "FAILED" ? (
          <div
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <p className="font-semibold">
              Patient saved locally, but FHIR synchronization failed.
            </p>
            <p className="mt-1">
              {patient.fhirLastError ??
                "The external health platform could not be reached."}
            </p>
            <PatientFhirRetryButton patientId={patient.id} />
          </div>
        ) : patient.fhirSyncStatus === "READ_ONLY" ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            Imported from the shared FHIR server. You may maintain local
            contact details and demographics, but this app cannot overwrite
            the external Patient resource.
          </div>
        ) : null}

        <dl className="mt-8 grid gap-6 border-t border-slate-200 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Date of birth
            </dt>
            <dd className="mt-2 font-medium">{formatDate(patient.dob)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Email
            </dt>
            <dd className="mt-2 break-all font-medium">
              {patient.email ?? "Not provided"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Phone
            </dt>
            <dd className="mt-2 font-medium">
              {patient.phone ?? "Not provided"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Last updated
            </dt>
            <dd className="mt-2 font-medium">
              {formatDate(patient.updatedAt)}
            </dd>
          </div>
        </dl>
      </section>

      <div className="mt-6">
        <ClinicalReviewPanel
          hasEvidence={labResults.length > 0 || completedScores.length > 0}
          patientId={patient.id}
          review={clinicalReview}
        />
      </div>

      <section
        className="app-card mt-6 scroll-mt-28 p-5 sm:p-6"
        id="lab-trends"
      >
        <div>
          <h2 className="text-lg font-bold">Lab trends</h2>
          <p className="mt-1 text-sm text-slate-500">
            Values are plotted by collection date. Shaded bands use the
            reference range from each test’s latest result.
          </p>
        </div>
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <LabTrendChart
            idPrefix="fasting-glucose"
            results={glucoseResults}
            title="Fasting glucose"
          />
          <LabTrendChart
            idPrefix="hba1c"
            results={hba1cResults}
            title="HbA1c"
          />
        </div>
      </section>

      <div className="mt-6 space-y-6">
        <section
          className="app-card min-w-0 scroll-mt-28 p-5 sm:p-6"
          id="lab-results"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Lab results</h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                {labResults.length}{" "}
                {labResults.length === 1 ? "result" : "results"}
              </span>
              <Link
                className="button-secondary button-compact text-teal-700"
                href="/labs"
              >
                Upload CSV
              </Link>
              {labResults.length > 0 ? (
                <a
                  className="button-primary button-compact"
                  download
                  href={`/patients/${patient.id}/labs.csv`}
                >
                  Download CSV
                </a>
              ) : null}
            </div>
          </div>
          {labResults.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center">
              <p className="text-sm font-medium text-slate-700">
                No lab results imported
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Glucose and HbA1c trends will appear here after a CSV import.
              </p>
              <Link
                className="mt-4 inline-block text-sm font-semibold text-teal-700 hover:text-teal-800"
                href="/labs"
              >
                Upload lab results
              </Link>
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <caption className="sr-only">
                    Imported lab results for {patient.fullName}
                  </caption>
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold" scope="col">
                        Date
                      </th>
                      <th className="px-4 py-3 font-semibold" scope="col">
                        Test
                      </th>
                      <th className="px-4 py-3 font-semibold" scope="col">
                        Value
                      </th>
                      <th className="px-4 py-3 font-semibold" scope="col">
                        Range
                      </th>
                      <th className="px-4 py-3 font-semibold" scope="col">
                        Source
                      </th>
                      <th className="px-4 py-3 font-semibold" scope="col">
                        Sync status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {labPage.items.map((result) => (
                      <tr className="transition hover:bg-[#f6fbfc]" key={result.id}>
                        <td className="whitespace-nowrap px-4 py-4">
                          {formatDate(result.collectedDate)}
                        </td>
                        <td className="px-4 py-4">
                          <span className="block font-semibold">
                            {result.testCode}
                          </span>
                          <span className="mt-1 block text-xs text-slate-500">
                            {result.testName}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-semibold">
                          {result.valueText}{" "}
                          <span className="font-normal text-slate-500">
                            {result.unit}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${labRangeStyles[result.rangeStatus]}`}
                          >
                            {labRangeLabels[result.rangeStatus]}
                          </span>
                          {result.refLowText && result.refHighText ? (
                            <span className="mt-1 block text-xs text-slate-500">
                              {result.refLowText}–{result.refHighText}{" "}
                              {result.unit}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${labSourceStyles[result.source]}`}
                          >
                            {labSourceLabels[result.source]}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${fhirSyncStyles[result.fhirSyncStatus]}`}
                          >
                            {labFhirSyncLabels[result.fhirSyncStatus]}
                          </span>
                          {result.fhirLastError ? (
                            <span className="mt-1 block max-w-64 text-xs leading-5 text-red-700">
                              {result.fhirLastError}
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="divide-y divide-slate-100 md:hidden">
                {labPage.items.map((result) => (
                  <li className="p-4" key={result.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {result.testCode}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {result.testName}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${labRangeStyles[result.rangeStatus]}`}
                      >
                        {labRangeLabels[result.rangeStatus]}
                      </span>
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-4 rounded-xl bg-slate-50 p-3">
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Collected
                        </p>
                        <p className="mt-1 text-sm font-medium">
                          {formatDate(result.collectedDate)}
                        </p>
                      </div>
                      <p className="text-right text-lg font-bold text-[#073a5a]">
                        {result.valueText}{" "}
                        <span className="text-xs font-medium text-slate-500">
                          {result.unit}
                        </span>
                      </p>
                    </div>

                    {result.refLowText && result.refHighText ? (
                      <p className="mt-3 text-xs text-slate-500">
                        Reference: {result.refLowText}–{result.refHighText}{" "}
                        {result.unit}
                      </p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${labSourceStyles[result.source]}`}
                      >
                        {labSourceLabels[result.source]}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${fhirSyncStyles[result.fhirSyncStatus]}`}
                      >
                        {labFhirSyncLabels[result.fhirSyncStatus]}
                      </span>
                    </div>
                    {result.fhirLastError ? (
                      <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
                        {result.fhirLastError}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
              <PaginationNav
                basePath={`/patients/${patient.id}`}
                currentPage={labPage.page}
                fragment="lab-results"
                label="Patient lab result pages"
                pageParam="labsPage"
                query={paginationQuery}
                totalPages={labPage.totalPages}
              />
            </div>
          )}
        </section>

        <section
          className="app-card min-w-0 scroll-mt-28 p-5 sm:p-6"
          id="assessments"
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <h2 className="text-lg font-bold">Assessment history</h2>
            <SendAssessmentButton
              patientEmail={patient.email}
              patientId={patient.id}
            />
          </div>
          <AssessmentScoreChart scores={completedScores} />
          {assessments.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center">
              <p className="text-sm font-medium text-slate-700">
                No questionnaires sent
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Send the DSMA-8 to begin tracking self-management risk.
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
              <ul className="divide-y divide-slate-100">
                {assessmentPage.items.map((assessment) => (
                  <li className="p-4" key={assessment.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        DSMA-8 v{assessment.questionnaireVersion}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Sent {formatDateTimeUtc(assessment.sentAt)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[assessment.displayStatus]}`}
                    >
                      {assessment.displayStatus.toLowerCase()}
                    </span>
                  </div>
                  {assessment.displayStatus === "COMPLETED" &&
                  assessment.score !== null &&
                  assessment.riskBand ? (
                    <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <span className="font-semibold">
                        Score {assessment.score}/24
                      </span>
                      <span className="mx-2 text-slate-300">·</span>
                      <span>{riskLabels[assessment.riskBand]}</span>
                    </div>
                  ) : assessment.displayStatus === "SENT" ? (
                    <p className="mt-3 text-xs text-slate-500">
                      Expires {formatDateTimeUtc(assessment.expiresAt)}
                    </p>
                  ) : null}
                  </li>
                ))}
              </ul>
              <PaginationNav
                basePath={`/patients/${patient.id}`}
                currentPage={assessmentPage.page}
                fragment="assessments"
                label="Patient assessment history pages"
                pageParam="assessmentsPage"
                query={paginationQuery}
                totalPages={assessmentPage.totalPages}
              />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
