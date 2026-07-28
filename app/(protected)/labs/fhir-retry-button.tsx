"use client";

import { useActionState } from "react";
import {
  retryLabImportFhirAction,
  type LabFhirRetryState,
} from "./actions";

const initialState: LabFhirRetryState = {};

export function LabFhirRetryButton({ importId }: { importId: string }) {
  const action = retryLabImportFhirAction.bind(null, importId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div>
      <form action={formAction}>
        <button
          className="button-secondary button-compact border-red-200 text-red-800 hover:border-red-300 hover:bg-red-100"
          disabled={pending}
          type="submit"
        >
          {pending ? "Retrying failed Observations…" : "Retry failed syncs"}
        </button>
      </form>
      {state.message ? (
        <p
          aria-live="polite"
          className={`mt-2 max-w-md text-xs font-medium ${
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
