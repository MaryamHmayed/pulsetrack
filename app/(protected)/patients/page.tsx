import Link from "next/link";
import { Icon } from "@/app/ui/icons";
import { listPatients } from "@/lib/data/patients";
import { PatientList } from "./patient-list";

export default async function PatientsPage() {
  const patients = await listPatients("");

  return (
    <main className="app-page">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="app-eyebrow">
            Patient management
          </p>
          <h1 className="app-title mt-2">Patients</h1>
          <p className="app-subtitle mt-2">
            Search and manage patients assigned to your account.
          </p>
        </div>
        <Link
          className="button-primary"
          href="/patients/new"
        >
          <Icon className="h-[18px] w-[18px]" name="plus" />
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
