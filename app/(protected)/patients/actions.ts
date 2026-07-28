"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireClinician } from "@/lib/auth/session";
import {
  createPatient as createPatientRecord,
  beginPatientFhirRetry,
  deletePatient as deletePatientRecord,
  updatePatient as updatePatientRecord,
} from "@/lib/data/patients";
import {
  validatePatientForm,
  type PatientFormState,
} from "@/lib/validation/patient";
import {
  syncCreatedPatientToFhir,
  syncUpdatedPatientToFhir,
} from "@/lib/fhir/patient-sync";
import { importHistoricalFhirData } from "@/lib/fhir/historical-import";
import { safeFhirSyncError } from "@/lib/fhir/sync-values";

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export type HistoricalFhirImportState = {
  kind?: "SUCCESS" | "ERROR";
  message?: string;
  summary?: {
    patientsTotal: number;
    patientsCreated: number;
    patientsMatched: number;
    observationsTotal: number;
    observationsCreated: number;
    observationsSkipped: number;
    observationConflicts: number;
  };
};

export type FhirRetryState = {
  kind?: "SUCCESS" | "ERROR";
  message?: string;
};

export async function retryPatientFhirAction(
  patientId: string,
  _previousState: FhirRetryState,
): Promise<FhirRetryState> {
  void _previousState;
  await requireClinician();

  try {
    const patient = await beginPatientFhirRetry(patientId);

    if (!patient) {
      return {
        kind: "ERROR",
        message:
          "This patient is not eligible for retry, or access was denied.",
      };
    }

    const result =
      patient.fhirOwnership === "OWNED" && patient.fhirResourceId
        ? await syncUpdatedPatientToFhir({
            ...patient,
            fhirOwnership: "OWNED",
            fhirResourceId: patient.fhirResourceId,
          })
        : await syncCreatedPatientToFhir(patient);

    revalidatePath("/patients");
    revalidatePath(`/patients/${patientId}`);

    return result.status === "SYNCED"
      ? {
          kind: "SUCCESS",
          message: "Patient synchronized with FHIR successfully.",
        }
      : {
          kind: "ERROR",
          message:
            "error" in result
              ? result.error
              : "FHIR synchronization could not be completed.",
        };
  } catch (error) {
    return {
      kind: "ERROR",
      message: safeFhirSyncError(error),
    };
  }
}

export async function importHistoricalFhirAction(
  _previousState: HistoricalFhirImportState,
  _formData: FormData,
): Promise<HistoricalFhirImportState> {
  void _previousState;
  void _formData;
  await requireClinician();

  try {
    const summary = await importHistoricalFhirData();
    revalidatePath("/dashboard");
    revalidatePath("/patients");
    revalidatePath("/labs");

    return {
      kind: "SUCCESS",
      message: "Historical FHIR data imported successfully.",
      summary,
    };
  } catch (error) {
    return {
      kind: "ERROR",
      message: safeFhirSyncError(error),
    };
  }
}

export async function createPatientAction(
  _previousState: PatientFormState,
  formData: FormData,
): Promise<PatientFormState> {
  await requireClinician();
  const result = validatePatientForm(formData);

  if (!result.success) {
    return {
      errors: result.errors,
      message: "Correct the highlighted fields.",
      values: result.values,
    };
  }

  let patientId: string;

  try {
    const patient = await createPatientRecord(result.data);
    patientId = patient.id;
    await syncCreatedPatientToFhir({
      ...patient,
      sex: result.data.sex,
    }).catch(() => undefined);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        errors: { mrn: ["A patient with this MRN already exists."] },
        message: "MRN must be unique.",
        values: result.values,
      };
    }

    return {
      message: "Unable to create the patient right now. Please try again.",
      values: result.values,
    };
  }

  revalidatePath("/patients");
  redirect(`/patients/${patientId}`);
}

export async function updatePatientAction(
  patientId: string,
  _previousState: PatientFormState,
  formData: FormData,
): Promise<PatientFormState> {
  await requireClinician();
  const result = validatePatientForm(formData);

  if (!result.success) {
    return {
      errors: result.errors,
      message: "Correct the highlighted fields.",
      values: result.values,
    };
  }

  try {
    const updated = await updatePatientRecord(patientId, result.data);

    if (!updated) {
      return { message: "Patient not found or access was denied." };
    }

    const patient = {
      ...updated,
      sex: result.data.sex,
    };

    if (
      patient.fhirOwnership === "OWNED" &&
      patient.fhirResourceId
    ) {
      await syncUpdatedPatientToFhir({
        ...patient,
        fhirOwnership: "OWNED",
        fhirResourceId: patient.fhirResourceId,
      }).catch(() => undefined);
    } else if (patient.fhirOwnership !== "READ_ONLY") {
      await syncCreatedPatientToFhir(patient).catch(() => undefined);
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        errors: { mrn: ["A patient with this MRN already exists."] },
        message: "MRN must be unique.",
        values: result.values,
      };
    }

    return {
      message: "Unable to update the patient right now. Please try again.",
      values: result.values,
    };
  }

  revalidatePath("/patients");
  revalidatePath(`/patients/${patientId}`);
  redirect(`/patients/${patientId}`);
}

export async function deletePatientAction(patientId: string) {
  await requireClinician();
  const deleted = await deletePatientRecord(patientId);

  if (deleted.count !== 1) {
    throw new Error("Patient not found or access was denied.");
  }

  revalidatePath("/patients");
  redirect("/patients");
}
