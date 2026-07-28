"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireClinician } from "@/lib/auth/session";
import { importLabCsv } from "@/lib/data/lab-imports";
import { LabCsvFileError } from "@/lib/labs/csv";
import { MAX_LAB_CSV_BYTES } from "@/lib/labs/upload";
import {
  retryLabImportToFhir,
  syncLabImportToFhir,
} from "@/lib/fhir/lab-sync";
import { safeFhirSyncError } from "@/lib/fhir/sync-values";

export type LabUploadState = {
  kind?: "ERROR";
  message?: string;
};

export type LabFhirRetryState = {
  kind?: "SUCCESS" | "ERROR";
  message?: string;
};

export async function retryLabImportFhirAction(
  importId: string,
  _previousState: LabFhirRetryState,
): Promise<LabFhirRetryState> {
  void _previousState;
  await requireClinician();

  try {
    const result = await retryLabImportToFhir(importId);
    revalidatePath(`/labs/${importId}`);
    revalidatePath("/labs");

    if (!result.eligible) {
      return {
        kind: "ERROR",
        message: "No failed local Observations are eligible for retry.",
      };
    }

    return result.failed === 0
      ? {
          kind: "SUCCESS",
          message: `${result.synced} Observation${
            result.synced === 1 ? "" : "s"
          } synchronized successfully.`,
        }
      : {
          kind: "ERROR",
          message: `${result.synced} synchronized; ${result.failed} still failed. Review the updated error below.`,
        };
  } catch (error) {
    return {
      kind: "ERROR",
      message: safeFhirSyncError(error),
    };
  }
}

export async function uploadLabCsvAction(
  _previousState: LabUploadState,
  formData: FormData,
): Promise<LabUploadState> {
  void _previousState;
  await requireClinician();

  const upload = formData.get("labFile");

  if (!(upload instanceof File) || upload.size === 0) {
    return {
      kind: "ERROR",
      message: "Choose a non-empty CSV file to upload.",
    };
  }

  if (!upload.name.toLowerCase().endsWith(".csv")) {
    return {
      kind: "ERROR",
      message: "Only .csv files are accepted.",
    };
  }

  if (upload.size > MAX_LAB_CSV_BYTES) {
    return {
      kind: "ERROR",
      message: "The CSV file must be 1 MB or smaller.",
    };
  }

  let importId: string;

  try {
    const result = await importLabCsv(upload.name, await upload.text());
    importId = result.importId;
    await syncLabImportToFhir(importId).catch(() => undefined);
  } catch (error) {
    return {
      kind: "ERROR",
      message:
        error instanceof LabCsvFileError
          ? error.message
          : "The import could not be completed. Your file was not fully processed; please try again.",
    };
  }

  redirect(`/labs/${importId}`);
}
