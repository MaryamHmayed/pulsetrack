"use client";

import { useActionState } from "react";
import {
  importHistoricalFhirAction,
  type HistoricalFhirImportState,
} from "./actions";

const initialState: HistoricalFhirImportState = {};

export function FhirHistoricalImport() {
  const [state, formAction, pending] = useActionState(
    importHistoricalFhirAction,
    initialState,
  );

  return (
    <section className="app-card mt-8 p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="app-eyebrow">FHIR historical data</p>
          <h2 className="mt-2 text-lg font-bold text-slate-900">
            Import national-platform history
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Import the five provided read-only patients and their historical
            glucose, HbA1c, and blood-pressure Observations. Running this again
            safely skips records already stored.
          </p>
        </div>
        <form action={formAction}>
          <button
            className="button-secondary min-w-44"
            disabled={pending}
            type="submit"
          >
            {pending ? "Importing history…" : "Import FHIR history"}
          </button>
        </form>
      </div>

      {state.message ? (
        <div
          aria-live="polite"
          className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
            state.kind === "SUCCESS"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
          role={state.kind === "ERROR" ? "alert" : "status"}
        >
          <p className="font-semibold">{state.message}</p>
          {state.summary ? (
            <p className="mt-1 leading-6">
              Patients: {state.summary.patientsCreated} created,{" "}
              {state.summary.patientsMatched} already matched. Observations:{" "}
              {state.summary.observationsCreated} created,{" "}
              {state.summary.observationsSkipped} skipped.
              {state.summary.observationConflicts > 0
                ? ` ${state.summary.observationConflicts} local date/test conflicts were preserved.`
                : ""}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
