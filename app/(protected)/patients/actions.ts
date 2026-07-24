"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireClinician } from "@/lib/auth/session";
import {
  createPatient as createPatientRecord,
  deletePatient as deletePatientRecord,
  updatePatient as updatePatientRecord,
} from "@/lib/data/patients";
import {
  validatePatientForm,
  type PatientFormState,
} from "@/lib/validation/patient";

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
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

    if (updated.count !== 1) {
      return { message: "Patient not found or access was denied." };
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
