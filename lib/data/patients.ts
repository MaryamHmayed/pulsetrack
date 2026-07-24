import "server-only";

import { db } from "@/lib/db";
import { requireClinician } from "@/lib/auth/session";
import type { ValidPatientInput } from "@/lib/validation/patient";

const patientSummarySelect = {
  id: true,
  fullName: true,
  dob: true,
  sex: true,
  mrn: true,
  email: true,
  phone: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listPatients(search: string) {
  const clinician = await requireClinician();
  const query = search.trim().slice(0, 100);

  return db.patient.findMany({
    where: {
      clinicianId: clinician.id,
      ...(query
        ? {
            OR: [
              { fullName: { contains: query, mode: "insensitive" as const } },
              { mrn: { contains: query, mode: "insensitive" as const } },
              { email: { contains: query, mode: "insensitive" as const } },
              { phone: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: [{ fullName: "asc" }, { createdAt: "desc" }],
    select: patientSummarySelect,
  });
}

export async function getPatient(patientId: string) {
  const clinician = await requireClinician();

  return db.patient.findFirst({
    where: {
      id: patientId,
      clinicianId: clinician.id,
    },
    select: patientSummarySelect,
  });
}

export async function createPatient(input: ValidPatientInput) {
  const clinician = await requireClinician();

  return db.patient.create({
    data: {
      ...input,
      clinicianId: clinician.id,
    },
    select: { id: true },
  });
}

export async function updatePatient(
  patientId: string,
  input: ValidPatientInput,
) {
  const clinician = await requireClinician();

  return db.patient.updateMany({
    where: {
      id: patientId,
      clinicianId: clinician.id,
    },
    data: input,
  });
}

export async function deletePatient(patientId: string) {
  const clinician = await requireClinician();

  return db.patient.deleteMany({
    where: {
      id: patientId,
      clinicianId: clinician.id,
    },
  });
}
