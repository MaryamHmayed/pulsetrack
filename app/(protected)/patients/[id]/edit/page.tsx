import Link from "next/link";
import { notFound } from "next/navigation";
import { getPatient } from "@/lib/data/patients";
import { PatientForm } from "../../patient-form";
import { updatePatientAction } from "../../actions";

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await getPatient(id);

  if (!patient) {
    notFound();
  }

  const action = updatePatientAction.bind(null, patient.id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        className="text-sm font-semibold text-teal-700 hover:text-teal-800"
        href={`/patients/${patient.id}`}
      >
        ← Back to patient
      </Link>
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
            Patient record
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Edit {patient.fullName}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Changes are validated on the server before being saved.
          </p>
        </div>
        <PatientForm
          action={action}
          cancelHref={`/patients/${patient.id}`}
          initialValues={{
            fullName: patient.fullName,
            dob: patient.dob.toISOString().slice(0, 10),
            sex: patient.sex,
            mrn: patient.mrn,
            email: patient.email,
            phone: patient.phone,
          }}
          submitLabel="Save changes"
        />
      </div>
    </main>
  );
}
