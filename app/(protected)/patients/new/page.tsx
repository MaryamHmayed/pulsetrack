import Link from "next/link";
import { PatientForm } from "../patient-form";
import { createPatientAction } from "../actions";

export default function NewPatientPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        className="text-sm font-semibold text-teal-700 hover:text-teal-800"
        href="/patients"
      >
        ← Back to patients
      </Link>
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
            New record
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
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
