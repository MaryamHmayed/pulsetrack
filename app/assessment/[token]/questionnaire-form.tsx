"use client";

import { useActionState } from "react";
import { dsma8 } from "@/lib/questionnaire/dsma8";
import {
  submitAssessmentAction,
  type AssessmentFormState,
} from "./actions";

const initialState: AssessmentFormState = {};

function TerminalState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
      <p className="mt-3 leading-7 text-slate-600">{message}</p>
      <p className="mt-4 text-sm text-slate-500">
        You may close this window. Contact your clinic if you need assistance.
      </p>
    </div>
  );
}

export function QuestionnaireForm({ token }: { token: string }) {
  const action = submitAssessmentAction.bind(null, token);
  const [state, formAction, pending] = useActionState(action, initialState);
  const invalidItems = new Set(state.invalidItemIds ?? []);

  if (state.kind === "SUCCESS") {
    return (
      <TerminalState
        message="Your responses have been securely recorded and are available to your care team."
        title="Thank you"
      />
    );
  }

  if (state.kind === "COMPLETED") {
    return (
      <TerminalState
        message="This link was already submitted. Your previous responses have not been changed."
        title="Assessment already completed"
      />
    );
  }

  if (state.kind === "EXPIRED") {
    return (
      <TerminalState
        message="Assessment links are valid for seven days. Ask your clinic to send a new one."
        title="Link expired"
      />
    );
  }

  if (state.kind === "INVALID") {
    return (
      <TerminalState
        message="This assessment link cannot be verified."
        title="Invalid link"
      />
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {state.message}
        </div>
      ) : null}

      {dsma8.items.map((item, index) => (
        <fieldset
          className={`rounded-2xl border bg-white p-5 shadow-sm sm:p-6 ${
            invalidItems.has(item.id) ? "border-red-300" : "border-slate-200"
          }`}
          key={item.id}
        >
          <legend className="px-1 text-base font-semibold leading-7 text-slate-900">
            <span className="mr-2 text-teal-700">{index + 1}.</span>
            {item.text}
          </legend>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {dsma8.options.map((option) => {
              const inputId = `${item.id}-${option.value}`;

              return (
                <label
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm transition hover:border-teal-400 hover:bg-teal-50"
                  htmlFor={inputId}
                  key={option.value}
                >
                  <input
                    defaultChecked={
                      state.values?.[item.id] === String(option.value)
                    }
                    id={inputId}
                    name={item.id}
                    required
                    type="radio"
                    value={option.value}
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
          {invalidItems.has(item.id) ? (
            <p className="mt-3 text-sm text-red-700">
              Select one answer for this question.
            </p>
          ) : null}
        </fieldset>
      ))}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm leading-6 text-slate-600">
          Submit only when all eight questions are answered. This secure link
          can be used once.
        </p>
        <button
          className="mt-4 w-full rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Submitting…" : "Submit assessment"}
        </button>
      </div>
    </form>
  );
}
