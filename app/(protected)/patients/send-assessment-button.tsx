"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  sendAssessmentAction,
  type SendAssessmentState,
} from "./assessment-actions";

const initialState: SendAssessmentState = {};

export function SendAssessmentButton({
  patientEmail,
  patientId,
}: {
  patientEmail: string | null;
  patientId: string;
}) {
  const action = sendAssessmentAction.bind(null, patientId);
  const [state, formAction, pending] = useActionState(action, initialState);

  if (!patientEmail) {
    return (
      <div className="max-w-sm sm:text-right">
        <button
          aria-describedby="assessment-email-required"
          className="button-primary min-h-10 cursor-not-allowed px-4 py-2 opacity-50"
          disabled
          type="button"
        >
          Send assessment
        </button>
        <p
          className="mt-2 text-sm leading-5 text-slate-600"
          id="assessment-email-required"
        >
          Add an email address before sending.{" "}
          <Link
            className="font-semibold text-teal-700 underline decoration-teal-300 underline-offset-2 hover:text-teal-800"
            href={`/patients/${patientId}/edit`}
          >
            Edit local record
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <form action={formAction}>
        <button
          className="button-primary min-h-10 px-4 py-2"
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
        </div>
      ) : null}
    </div>
  );
}
