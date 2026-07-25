import Link from "next/link";
import { PatientForm } from "../patient-form";
import { createPatientAction } from "../actions";

export default function NewPatientPage() {
  return (
    <main className="app-page max-w-3xl">
      <Link
        className="text-sm font-semibold text-teal-700 hover:text-teal-800"
        href="/patients"
      >
        ← Back to patients
      </Link>
      <div className="app-card mt-6 p-6 sm:p-8">
        <div className="mb-8">
          <p className="app-eyebrow">
            New record
          </p>
          <h1 className="app-title mt-2">
            Add patient
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            All fields are required. MRNs must be unique across the clinic.
          </p>
        </div>
        <PatientForm
          action={createPatientAction}
          cancelHref="/patients"
          submitLabel="Create patient"
        />
      </div>
    </main>
  );
}
