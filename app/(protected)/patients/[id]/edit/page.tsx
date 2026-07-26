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
  const isReadOnlyFhirPatient = patient.fhirOwnership === "READ_ONLY";

  return (
    <main className="app-page max-w-3xl">
      <Link
        className="text-sm font-semibold text-teal-700 hover:text-teal-800"
        href={`/patients/${patient.id}`}
      >
        ← Back to patient
      </Link>
      <div className="app-card mt-6 p-6 sm:p-8">
        <div className="mb-8">
          <p className="app-eyebrow">
            Patient record
          </p>
          <h1 className="app-title mt-2">
            Edit local record for {patient.fullName}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Changes are validated on the server before being saved locally.
          </p>
        </div>
        {isReadOnlyFhirPatient ? (
          <div className="mb-8 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
            This patient was imported from the shared FHIR server. You can add
            local contact details and correct local demographics, but the
            linked FHIR Patient remains unchanged and its MRN is locked.
          </div>
        ) : null}
        <PatientForm
          action={action}
          cancelHref={`/patients/${patient.id}`}
          initialValues={{
            fullName: patient.fullName,
            dob: patient.dob.toISOString().slice(0, 10),
            sex: patient.sex,
            mrn: patient.mrn,
            email: patient.email ?? "",
            phone: patient.phone ?? "",
          }}
          lockMrn={isReadOnlyFhirPatient}
          submitLabel="Save changes"
        />
      </div>
    </main>
  );
}
