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
  fhirResourceId: true,
  fhirOwnership: true,
  fhirSyncStatus: true,
  fhirLastSyncedAt: true,
  fhirLastError: true,
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
    select: {
      id: true,
      fullName: true,
      dob: true,
      sex: true,
      mrn: true,
      email: true,
      phone: true,
    },
  });
}

export async function updatePatient(
  patientId: string,
  input: ValidPatientInput,
) {
  const clinician = await requireClinician();

  return db.$transaction(
    async (transaction) => {
      const current = await transaction.patient.findFirst({
        where: {
          id: patientId,
          clinicianId: clinician.id,
        },
        select: {
          id: true,
          mrn: true,
          fhirOwnership: true,
        },
      });

      if (!current) {
        return null;
      }

      await transaction.patient.update({
        where: { id: current.id },
        data: {
          ...input,
          mrn:
            current.fhirOwnership === "READ_ONLY" ? current.mrn : input.mrn,
          ...(current.fhirOwnership === "READ_ONLY"
            ? {}
            : {
                fhirSyncStatus: "PENDING" as const,
                fhirLastError: null,
              }),
        },
      });

      return transaction.patient.findUnique({
        where: { id: current.id },
        select: {
          id: true,
          fullName: true,
          dob: true,
          sex: true,
          mrn: true,
          email: true,
          phone: true,
          fhirResourceId: true,
          fhirOwnership: true,
          fhirSyncStatus: true,
        },
      });
    },
    {
      isolationLevel: "Serializable",
      maxWait: 5_000,
      timeout: 10_000,
    },
  );
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
