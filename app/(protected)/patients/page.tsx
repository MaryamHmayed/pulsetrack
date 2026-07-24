import Link from "next/link";
import { listPatients } from "@/lib/data/patients";
import { PatientList } from "./patient-list";

export default async function PatientsPage() {
  const patients = await listPatients("");

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
            Patient management
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Patients</h1>
          <p className="mt-2 text-slate-600">
            Search and manage patients assigned to your account.
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
          href="/patients/new"
        >
          Add patient
        </Link>
      </div>

      <PatientList
        patients={patients.map((patient) => ({
          id: patient.id,
          fullName: patient.fullName,
          dob: patient.dob.toISOString().slice(0, 10),
          sex: patient.sex,
          mrn: patient.mrn,
          email: patient.email,
          phone: patient.phone,
        }))}
      />
    </main>
  );
}
