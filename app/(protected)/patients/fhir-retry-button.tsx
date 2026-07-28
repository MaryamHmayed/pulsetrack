"use client";

import { useActionState } from "react";
import {
  retryPatientFhirAction,
  type FhirRetryState,
} from "./actions";

const initialState: FhirRetryState = {};

export function PatientFhirRetryButton({
  patientId,
}: {
  patientId: string;
}) {
  const action = retryPatientFhirAction.bind(null, patientId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="mt-3">
      <form action={formAction}>
        <button
          className="button-secondary button-compact border-red-200 text-red-800 hover:border-red-300 hover:bg-red-100"
          disabled={pending}
          type="submit"
        >
          {pending ? "Retrying FHIR sync…" : "Retry FHIR sync"}
        </button>
      </form>
      {state.message ? (
        <p
          aria-live="polite"
          className={`mt-2 text-xs font-medium ${
            state.kind === "SUCCESS" ? "text-emerald-800" : "text-red-800"
          }`}
          role={state.kind === "ERROR" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
