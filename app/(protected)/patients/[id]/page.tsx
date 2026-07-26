import Link from "next/link";
import { notFound } from "next/navigation";
import { getPatient } from "@/lib/data/patients";
import { getAssessmentHistory } from "@/lib/data/assessments";
import { getPatientLabResults } from "@/lib/data/lab-results";
import { formatDateTimeUtc } from "@/lib/format/date";
import { DeletePatientButton } from "../delete-patient-button";
import { SendAssessmentButton } from "../send-assessment-button";
import { AssessmentScoreChart } from "./assessment-score-chart";
import { LabTrendChart } from "./lab-trend-chart";

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
  PENDING: "FHIR pending",
  SYNCED: "FHIR synced",
  FAILED: "FHIR failed",
  READ_ONLY: "FHIR read-only",
} as const;

const labFhirSyncLabels = {
  PENDING: "Pending",
  SYNCED: "Synced",
  FAILED: "Failed",
  READ_ONLY: "Imported",
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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await getPatient(id);

  if (!patient) {
    notFound();
  }

  const [assessments, labResults] = await Promise.all([
    getAssessmentHistory(patient.id),
    getPatientLabResults(patient.id),
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

  return (
    <main className="app-page">
      <Link
        className="text-sm font-semibold text-teal-700 hover:text-teal-800"
        href="/patients"
      >
        ← Back to patients
      </Link>

      <section className="app-card mt-6 overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-mono text-sm text-slate-500">{patient.mrn}</p>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${fhirSyncStyles[patient.fhirSyncStatus]}`}
              >
                {fhirSyncLabels[patient.fhirSyncStatus]}
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
              Edit patient
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
          </div>
        ) : patient.fhirSyncStatus === "READ_ONLY" ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            This MRN is linked to an existing read-only FHIR Patient. Local
            changes will not overwrite that external record.
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

      <section className="app-card mt-6 p-5 sm:p-6">
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

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="app-card min-w-0 p-5 sm:p-6">
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
              <div className="overflow-x-auto">
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
                        FHIR
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {labResults.map((result) => (
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
            </div>
          )}
        </section>

        <section className="app-card min-w-0 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <h2 className="text-lg font-bold">Assessment history</h2>
            <SendAssessmentButton patientId={patient.id} />
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
            <ul className="mt-6 divide-y divide-slate-100 rounded-xl border border-slate-200">
              {assessments.map((assessment) => (
                <li className="p-4" key={assessment.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        DSMA-8 v{assessment.questionnaireVersion}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Sent {formatDateTimeUtc(assessment.sentAt)} ·{" "}
                        {assessment.deliveryMode === "PREVIEW"
                          ? "Preview"
                          : "Email"}
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
          )}
        </section>
      </div>
    </main>
  );
}
