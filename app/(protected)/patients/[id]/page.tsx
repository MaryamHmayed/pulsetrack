import Link from "next/link";
import { notFound } from "next/navigation";
import { getPatient } from "@/lib/data/patients";
import { getAssessmentHistory } from "@/lib/data/assessments";
import { DeletePatientButton } from "../delete-patient-button";
import { SendAssessmentButton } from "../send-assessment-button";

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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

  const assessments = await getAssessmentHistory(patient.id);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        className="text-sm font-semibold text-teal-700 hover:text-teal-800"
        href="/patients"
      >
        ← Back to patients
      </Link>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div>
            <p className="font-mono text-sm text-slate-500">{patient.mrn}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              {patient.fullName}
            </h1>
            <p className="mt-2 text-slate-600">
              {getAge(patient.dob)} years old ·{" "}
              <span className="capitalize">{patient.sex.toLowerCase()}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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
            <dd className="mt-2 break-all font-medium">{patient.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Phone
            </dt>
            <dd className="mt-2 font-medium">{patient.phone}</dd>
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

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Lab trends</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
              No data
            </span>
          </div>
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center">
            <p className="text-sm font-medium text-slate-700">
              No lab results imported
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Glucose and HbA1c trends will appear here after a CSV import.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <h2 className="text-lg font-bold">Assessment history</h2>
            <SendAssessmentButton patientId={patient.id} />
          </div>
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
                        Sent {formatDateTime(assessment.sentAt)} ·{" "}
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
                      Expires {formatDateTime(assessment.expiresAt)}
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
