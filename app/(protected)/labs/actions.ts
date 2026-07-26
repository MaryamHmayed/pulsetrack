"use server";

import { redirect } from "next/navigation";
import { requireClinician } from "@/lib/auth/session";
import { importLabCsv } from "@/lib/data/lab-imports";
import { LabCsvFileError } from "@/lib/labs/csv";
import { MAX_LAB_CSV_BYTES } from "@/lib/labs/upload";
import { syncLabImportToFhir } from "@/lib/fhir/lab-sync";

export type LabUploadState = {
  kind?: "ERROR";
  message?: string;
};

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
