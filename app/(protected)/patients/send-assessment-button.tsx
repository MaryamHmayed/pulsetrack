"use client";

import { useActionState } from "react";
import {
  sendAssessmentAction,
  type SendAssessmentState,
} from "./assessment-actions";

const initialState: SendAssessmentState = {};

export function SendAssessmentButton({ patientId }: { patientId: string }) {
  const action = sendAssessmentAction.bind(null, patientId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div>
      <form action={formAction}>
        <button
          className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Sending…" : "Send assessment"}
        </button>
      </form>
      {state.message ? (
        <div
          aria-live="polite"
          className={`mt-3 rounded-xl px-4 py-3 text-sm ${
            state.kind === "ERROR"
              ? "bg-red-50 text-red-700"
              : "bg-teal-50 text-teal-800"
          }`}
          role={state.kind === "ERROR" ? "alert" : "status"}
        >
          <p>{state.message}</p>
          {state.previewUrl ? (
            <a
              className="mt-2 inline-block font-semibold underline"
              href={state.previewUrl}
              rel="noreferrer"
              target="_blank"
            >
              Open preview assessment
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
